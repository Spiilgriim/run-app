<template>
  <Page class="page">
    <ActionBar class="action-bar">
      <!--
            Use the NavigationButton as a side-drawer button in Android
            because ActionItems are shown on the right side of the ActionBar
            -->
      <NavigationButton
        ios:visibility="collapsed"
        icon="res://menu"
        @tap="onDrawerButtonTap"
      />
      <!--
            Use the ActionItem for IOS with position set to left. Using the
            NavigationButton as a side-drawer button in iOS is not possible,
            because its function is to always navigate back in the application.
            -->
      <ActionItem
        icon="res://menu"
        android:visibility="collapsed"
        @tap="onDrawerButtonTap"
        ios.position="left"
      />

      <Label text="Run!" class="action-label"></Label>
    </ActionBar>
    <GridLayout rows="*, 160">
      <Mapbox
        :accessToken="accessToken"
        mapStyle="streets"
        latitude="37.7397"
        longitude="-121.4252"
        hideCompass="false"
        zoomLevel="12"
        showUserLocation="true"
        disableZoom="false"
        disableRotation="false"
        disableScroll="false"
        disableTilt="false"
        @mapReady="onMapReady($event)"
        row="0"
      >
      </Mapbox>
      <GridLayout columns="*,*" rows="80,80" row="1">
        <Button
          v-show="status == 0"
          text.decode="&#xf04b;"
          class="big-play-button fas"
          @tap="start"
          row="0"
          col="0"
          colSpan="2"
          rowSpan="2"
        ></Button>
        <Label v-show="status != 0" class="chrono-display" row="0" col="0">{{
          this.chronoFormat
        }}</Label>
        <Button
          text.decode="&#xf04c;"
          class="pause-button fas"
          @tap="pause"
          v-show="status == 1"
          row="1"
          col="0"
        ></Button>
        <Button
          text.decode="&#xf04b;"
          class="small-play-button fas"
          @tap="start"
          v-show="status == 2"
          row="1"
          col="0"
        ></Button>
        <Button
          text.decode="&#xf04d;"
          class="stop-button fas"
          @tap="stop"
          v-show="status != 0"
          row="1"
          col="1"
        ></Button>
        <Label v-show="status != 0" class="distance-display" row="0" col="1">{{
          this.distance
        }}</Label>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script>
import * as utils from "~/shared/utils";
import SelectedPageService from "../shared/selected-page-service";
import { mapboxToken } from "../secret.js";
const timerModule = require("tns-core-modules/timer");
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import saveModal from "./saveModal";
const appSettings = require("tns-core-modules/application-settings");
import { getString, setString } from "@nativescript/core/application-settings";

export default {
  name: "Run",
  data() {
    return {
      accessToken: mapboxToken,
      departTime: -1,
      status: 0, // 0 : stopped , 1 : running , 2 : paused
      chrono: 0,
      timer: undefined,
      locationWatcher: undefined,
      locations: [],
      map: undefined,
      lastSaved: { latitude: 0, longitude: 0 },
    };
  },
  computed: {
    chronoFormat() {
      let chronoDate = new Date(this.chrono);
      if (chronoDate > 3600000) {
        return (
          chronoDate.getUTCHours() +
          ":" +
          (chronoDate.getUTCMinutes() < 10
            ? "0" + chronoDate.getUTCMinutes()
            : chronoDate.getUTCMinutes()) +
          ":" +
          chronoDate.getUTCSeconds()
        );
      } else {
        if (chronoDate > 60000) {
          return (
            chronoDate.getUTCMinutes() +
            ":" +
            (chronoDate.getUTCSeconds() < 10
              ? "0" + chronoDate.getUTCSeconds()
              : chronoDate.getUTCSeconds()) +
            "." +
            chronoDate.getUTCMilliseconds() / 100
          );
        } else {
          return (
            chronoDate.getUTCSeconds() +
            "." +
            chronoDate.getUTCMilliseconds() / 100
          );
        }
      }
    },
    distance() {
      let distance = 0;
      if (this.locations.length < 2) {
        return "0m";
      }
      for (let i = 0; i < this.locations.length - 1; i++) {
        distance += this.calcCrow(
          this.locations[i].latitude,
          this.locations[i].longitude,
          this.locations[i + 1].latitude,
          this.locations[i + 1].longitude
        );
      }
      if (distance < 1) {
        return (distance * 1000).toFixed(1) + "m";
      } else {
        return distance.toFixed(2) + "km";
      }
      return distance;
    },
  },
  mounted() {
    SelectedPageService.getInstance().updateSelectedPage("Run");
  },
  methods: {
    onDrawerButtonTap() {
      utils.showDrawer();
    },
    startChrono() {
      this.chrono += 100;
    },
    onMapReady(args) {
      this.map = args.map;
      this.map.addPolyline({
        color: "#3357C0", // Set the color of the line (default black)
        width: 3, // Set the width of the line (default 5)
        opacity: 1, //Transparency / alpha, ranging 0-1. Default fully opaque (1).
        points: this.locations.map((x) => {
          return { lat: x.latitude, lng: x.longitude };
        }),
      });
    },
    start() {
      this.departTime = new Date();
      this.status = 1;
      this.timer = timerModule.setInterval(() => {
        this.chrono += 100;
      }, 100);
      this.startLocationWatch();
    },
    pause() {
      timerModule.clearInterval(this.timer);
      this.status = 2;
    },
    stop() {
      timerModule.clearInterval(this.timer);
      geolocation.clearWatch(this.locationWatcher);
      this.$showModal(saveModal, {
        props: {
          defaultName:
            this.departTime.toDateString() +
            " - " +
            this.departTime.getHours() +
            ":" +
            (this.departTime.getMinutes() < 10
              ? "0" + this.departTime.getUTCMinutes()
              : this.departTime.getUTCMinutes()),
        },
        fullscreen: false,
        animated: true,
        stretched: false,
        dimAmount: 0.5,
      }).then((data) => {
        if (!data.reset) {
          let oldList = JSON.parse(appSettings.getString("runs", "[]"));
          oldList.push({
            name: data.name,
            departTime: this.departTime,
            chronoFormat: this.chronoFormat,
            chrono: this.chrono,
            locations: this.locations,
            distanceFormat: this.distance,
          });
          appSettings.setString("runs", JSON.stringify(oldList));
        }
        this.status = 0;
        this.chrono = 0;
        this.map.removePolylines();
        this.locations = [];
      });
    },
    startLocationWatch() {
      let that = this;
      try {
        this.locationWatcher = geolocation.watchLocation(
          function(loc) {
            if (loc) {
              if (
                that.calcCrow(
                  loc.latitude,
                  loc.longitude,
                  that.lastSaved.latitude,
                  that.lastSaved.longitude
                ) > 0.01
              ) {
                that.lastSaved = loc;
                that.locations.push(loc);
                that.map.removePolylines();
                that.map.addPolyline({
                  color: "#3357C0", // Set the color of the line (default black)
                  width: 3, // Set the width of the line (default 5)
                  opacity: 1, //Transparency / alpha, ranging 0-1. Default fully opaque (1).
                  points: that.locations.map((x) => {
                    return { lat: x.latitude, lng: x.longitude };
                  }),
                });
              }
            }
          },
          function(e) {
            console.log("Error: " + e.message);
          },
          {
            desiredAccuracy: Accuracy.high,
            updateDistance: 1,
            updateTime: 3000,
            minimumUpdateTime: 100,
          }
        );
      } catch (ex) {
        console.log("Error: " + ex.message);
      }
    },
    calcCrow(lat1, lon1, lat2, lon2) {
      var R = 6371; // km
      var dLat = this.toRad(lat2 - lat1);
      var dLon = this.toRad(lon2 - lon1);
      var lat1 = this.toRad(lat1);
      var lat2 = this.toRad(lat2);

      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) *
          Math.sin(dLon / 2) *
          Math.cos(lat1) *
          Math.cos(lat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d;
    },

    toRad(Value) {
      return (Value * Math.PI) / 180;
    },
  },
};
</script>

<style scoped>
.action-bar {
  background-color: #1da1f2;
  color: white;
}

.action-label {
  color: white;
  font-size: 24;
  font-weight: bold;
  vertical-align: center;
}

.big-play-button {
  background-color: #1da1f2;
  color: white;
  width: 100%;
  font-size: 30px;
}

.small-play-button {
  background-color: #1da1f2;
  color: white;
}

.pause-button {
  color: white;
  background-color: #657786;
}

.stop-button {
  color: white;
  background-color: #14171a;
}

.distance-display {
  font-size: 30;
  color: #1da1f2;
  text-align: center;
  border-width: 7px;
  border-radius: 20px;
  border-color: #14171a;
  margin: 10;
  padding-top: 5;
}

.chrono-display {
  font-size: 30;
  color: #14171a;
  text-align: center;
  border-width: 7px;
  border-radius: 20px;
  border-color: #1da1f2;
  margin: 10;
  padding-top: 5;
}
</style>
