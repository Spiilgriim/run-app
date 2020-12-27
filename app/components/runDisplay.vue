<template>
  <Page class="page">
    <ActionBar class="action-bar">
      <NavigationButton
        text="Back"
        android.systemIcon="ic_menu_back"
        @tap="$navigateBack"
      />
      <Label :text="name" class="action-label"></Label>
    </ActionBar>
    <GridLayout rows="*, 200">
      <Mapbox
        :accessToken="accessToken"
        mapStyle="streets"
        :latitude="locations[0].latitude"
        :longitude="locations[0].longitude"
        hideCompass="false"
        zoomLevel="12"
        disableZoom="false"
        disableRotation="false"
        disableScroll="false"
        disableTilt="false"
        @mapReady="onMapReady($event)"
        row="0"
      >
      </Mapbox>
      <Carousel
        indicatorColor="#14171A"
        finite="true"
        showIndicator="true"
        verticalAlignment="top"
        android:indicatorAnimation="worm"
        color="white"
        row="1"
        height="200"
        indicatorOffset="0,200"
      >
        <CarouselItem
          id="slide1"
          backgroundColor="#1da1f2"
          verticalAlignment="middle"
        >
          <GridLayout columns="*,*" height="150" class="first-slide">
            <Label
              text.decode="&#xf2f2;"
              class="fas carousel-icon"
              col="0"
            ></Label>
            <Label class="big-label-left" col="0">{{ chrono }}</Label>

            <Label
              text.decode="&#xf4d7;"
              class="fas carousel-icon"
              col="1"
            ></Label>
            <Label class="big-label-right" col="1">{{ distance }}</Label>
          </GridLayout>
        </CarouselItem>
        <CarouselItem
          id="slide2"
          backgroundColor="#f5f8fa"
          verticalAlignment="middle"
        >
          <Label
            color="black"
            text="Stats when more ideas"
            horizontalAlignment="center"
          />
        </CarouselItem>
      </Carousel>
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
  props: { data: { type: Object, required: true } },
  data() {
    return {
      name: this.data.name,
      accessToken: mapboxToken,
      departTime: this.data.departTime,
      chrono: this.data.chrono,
      locations: this.data.locations,
      distance: this.data.distance,
      map: undefined,
    };
  },
  computed: {},
  methods: {
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
  width: 100%;
  font-size: 30px;
}

.pause-button {
  color: white;
  background-color: #657786;
  width: 25%;
}

.stop-button {
  color: white;
  background-color: #14171a;
  width: 25%;
}

.big-label-left {
  width: 50%;
  font-size: 30;
  color: white;
  text-align: center;
  height: 120;
  font-weight: bold;
  padding-top: 35;
  border-color: #aab8c2;
  border-width: 0 1 0 0;
}

.big-label-right {
  width: 50%;
  font-size: 30;
  color: white;
  text-align: center;
  height: 120;
  font-weight: bold;
  padding-top: 35;
  border-color: #aab8c2;
  border-width: 0 0 0 1;
}

.carousel-icon {
  color: #e1e8ed;
  font-size: 120;
  opacity: 0.4;
  text-align: center;
  width: 50%;
  height: 150;
  padding-top: 10;
}

.first-slide {
  margin-top: 10;
}
</style>
