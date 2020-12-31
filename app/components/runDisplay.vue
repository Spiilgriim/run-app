<template>
  <Page class="page">
    <ActionBar class="action-bar">
      <NavigationButton
        text="Back"
        android.systemIcon="ic_menu_back"
        @tap="$navigateBack"
      />
      <Label :text="name" class="action-label"></Label>
      <ActionItem
        @tap="shareRun"
        ios.systemIcon="9"
        ios.position="right"
        android.systemIcon="ic_menu_share"
        android.position="actionBar"
      ></ActionItem>
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
        <CarouselItem backgroundColor="#1da1f2" verticalAlignment="middle">
          <GridLayout columns="*,*" height="150" class="first-slide">
            <Label
              text.decode="&#xf2f2;"
              class="fas carousel-icon"
              col="0"
            ></Label>
            <Label class="big-label-left" col="0">{{ chronoFormat }}</Label>

            <Label
              text.decode="&#xf4d7;"
              class="fas carousel-icon"
              col="1"
            ></Label>
            <Label class="big-label-right" col="1">{{ distanceFormat }}</Label>
          </GridLayout>
        </CarouselItem>
        <CarouselItem backgroundColor="#1da1f2" verticalAlignment="middle">
          <GridLayout
            columns="*,*"
            rows="*,*"
            height="150"
            class="second-slide"
          >
            <Label
              text.decode="&#xf3fd;"
              class="fas small-carousel-icon"
              col="0"
              row="0"
            ></Label>
            <Label class="big-label-top-left" col="0" row="0">{{
              averageSpeed
            }}</Label>
            <Label
              text.decode="&#xf6fc;"
              class="fas small-carousel-icon"
              col="0"
              row="1"
            ></Label>
            <Label class="big-label-bottom-left" col="0" row="1">{{
              elevation
            }}</Label>
            <Label
              text.decode="&#xf067;"
              class="fas small-carousel-icon"
              col="1"
              row="0"
            ></Label>
            <Label class="big-label-top-right" col="1" row="0">{{
              highestSpeed
            }}</Label>
            <Label
              text.decode="&#xf068;"
              class="fas small-carousel-icon"
              col="1"
              row="1"
            ></Label>
            <Label class="big-label-bottom-right" col="1" row="1">{{
              lowestSpeed
            }}</Label>
          </GridLayout>
        </CarouselItem>
      </Carousel>
    </GridLayout>
  </Page>
</template>

<script>
import * as utils from "~/shared/utils";
import SelectedPageService from "../shared/selected-page-service";
import { mapboxToken } from "../secret.js";
import saveModal from "./saveModal";
const appSettings = require("tns-core-modules/application-settings");
import { getBoolean } from "@nativescript/core/application-settings";
var SocialShare = require("nativescript-social-share");
const fs = require("tns-core-modules/file-system");
const permissions = require("nativescript-permissions");
import * as application from "tns-core-modules/application";
import { run } from "tns-core-modules/application";
import { ImageSource } from "image-source";
import { ShareFile } from "nativescript-share-file";

export default {
  name: "RunDisplay",
  props: { data: { type: Object, required: true } },
  data() {
    return {
      name: this.data.name,
      accessToken: mapboxToken,
      departTime: this.data.departTime,
      chrono: this.data.chrono,
      chronoFormat: this.data.chronoFormat,
      locations: this.data.locations,
      distanceFormat: this.data.distanceFormat,
      map: undefined,
    };
  },
  computed: {
    distance() {
      let distance = 0;
      for (let i = 0; i < this.locations.length - 1; i++) {
        distance += this.calcCrow(
          this.locations[i].latitude,
          this.locations[i].longitude,
          this.locations[i + 1].latitude,
          this.locations[i + 1].longitude
        );
      }
      return distance;
    },
    averageSpeed() {
      if (appSettings.getBoolean("altSpeedSettings", false)) {
        return (this.chrono / 60000 / this.distance).toFixed(1) + "min/km";
      } else {
        return (this.distance / (this.chrono / 3600000)).toFixed(1) + "km/h";
      }
    },
    highestSpeed() {
      if (this.distance < 1) {
        return this.averageSpeed;
      }
      let distance = 0;
      let time = 0;
      let maxSpeed = 0;
      let kmSpeed = 0;
      let temp = 0;
      let deltaT = 0;
      for (let i = 0; i < this.locations.length - 1; i++) {
        temp = this.calcCrow(
          this.locations[i].latitude,
          this.locations[i].longitude,
          this.locations[i + 1].latitude,
          this.locations[i + 1].longitude
        );
        deltaT =
          new Date(this.locations[i + 1].timestamp).getTime() -
          new Date(this.locations[i].timestamp).getTime();
        if (distance + temp >= 1) {
          kmSpeed = 1 / (time + ((1 - distance) / temp) * deltaT);
          if (kmSpeed > maxSpeed) {
            maxSpeed = kmSpeed;
          }
          time = deltaT * (1 - (1 - distance) / temp);
          distance = temp - 1 + distance;
        } else {
          distance += temp;
          time += deltaT;
        }
      }
      if (appSettings.getBoolean("altSpeedSettings", false)) {
        return (60 / (maxSpeed * 3600000)).toFixed(1) + "min/km";
      } else {
        return (maxSpeed * 3600000).toFixed(1) + "km/h";
      }
    },
    lowestSpeed() {
      if (this.distance < 1) {
        return this.averageSpeed;
      }
      let distance = 0;
      let time = 0;
      let minSpeed = Number.MAX_SAFE_INTEGER;
      let kmSpeed = 0;
      let temp = 0;
      let deltaT = 0;
      for (let i = 0; i < this.locations.length - 1; i++) {
        temp = this.calcCrow(
          this.locations[i].latitude,
          this.locations[i].longitude,
          this.locations[i + 1].latitude,
          this.locations[i + 1].longitude
        );
        deltaT =
          new Date(this.locations[i + 1].timestamp).getTime() -
          new Date(this.locations[i].timestamp).getTime();
        if (distance + temp >= 1) {
          kmSpeed = 1 / (time + ((1 - distance) / temp) * deltaT);
          if (kmSpeed < minSpeed) {
            minSpeed = kmSpeed;
          }
          time = deltaT * (1 - (1 - distance) / temp);
          distance = temp - 1 + distance;
        } else {
          distance += temp;
          time += deltaT;
        }
      }
      if (appSettings.getBoolean("altSpeedSettings", false)) {
        return (60 / (minSpeed * 3600000)).toFixed(1) + "min/km";
      } else {
        return (minSpeed * 3600000).toFixed(1) + "km/h";
      }
    },
    elevation() {
      let elevation = 0;
      for (let i = 0; i < this.locations.length - 1; i++) {
        if (this.locations[i + 1].altitude - this.locations[i].altitude > 0) {
          elevation +=
            this.locations[i + 1].altitude - this.locations[i].altitude;
        }
      }
      return elevation.toFixed(1) + "m";
    },
  },
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
      this.map.addMarkers([
        {
          lat: this.locations[0].latitude,
          lng: this.locations[0].longitude,
        },
      ]);
      this.map.addMarkers([
        {
          lat: this.locations[this.locations.length - 1].latitude,
          lng: this.locations[this.locations.length - 1].longitude,
        },
      ]);
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
    shareRun() {
      action("How do you want to share you Run!", "cancel", [
        "Location File",
        "Preview Picture",
      ]).then(async (result) => {
        if (result == "Preview Picture") {
          try {
            const runImage = await ImageSource.fromUrl(this.getPreview());
            SocialShare.shareImage(runImage);
          } catch (err) {
            alert(err);
          }
        } else {
          if (result == "Location File") {
            let StringToExport = "";
            if (appSettings.getBoolean("useKMLFormat", false)) {
              StringToExport = this.generateKML();
            } else {
              StringToExport = this.generateGeoJSON();
            }
            permissions
              .requestPermission(
                android.Manifest.permission.WRITE_EXTERNAL_STORAGE
              )
              .then(() => {
                const sdDownloadPath = android.os.Environment.getExternalStoragePublicDirectory(
                  android.os.Environment.DIRECTORY_DOWNLOADS
                ).toString();
                const folder = fs.Folder.fromPath(
                  fs.path.join(sdDownloadPath, "Run! Exports")
                );
                const regex = /\\*\/*:*\**\?*<*>*\|*\.*/g;
                let safeName = this.name.replace(regex, "");
                const file = folder.getFile(
                  appSettings.getBoolean("useKMLFormat", false)
                    ? safeName + ".kml"
                    : safeName + ".geojson"
                );
                file.writeText(StringToExport);
                let shareFile = new ShareFile();

                shareFile.open({
                  path: file.path,
                });
              })
              .catch((err) => {
                alert(err);
              });
          }
        }
      });
    },
    generateGeoJSON() {
      const header =
        '{"type": "FeatureCollection","features":[{"type":"Feature","properties":{"stroke": "#3357c0","stroke-width": 3,"stroke-opacity":1},"geometry":{"type":"LineString","coordinates":[';
      const tail =
        ']}},{"type":"Feature","properties":{"marker-color":"#657786","marker-size":"large","marker-symbol":"pitch"},"geometry":{"type":"Point","coordinates": [' +
        this.locations[0].longitude.toFixed(5) +
        "," +
        this.locations[0].latitude.toFixed(5) +
        ']}},{"type":"Feature","properties":{"marker-color":"#1da1f2","marker-size":"large","marker-symbol":"star"},"geometry":{"type":"Point","coordinates":[' +
        this.locations[this.locations.length - 1].longitude.toFixed(5) +
        "," +
        this.locations[this.locations.length - 1].latitude.toFixed(5) +
        "]}}]}";
      let res = header;
      for (let i = 0; i < this.locations.length; i++) {
        res +=
          "[" +
          this.locations[i].longitude.toFixed(5) +
          "," +
          this.locations[i].latitude.toFixed(5) +
          "]";
        if (i != this.locations.length - 1) {
          res += ",";
        }
      }
      res += tail;
      return res;
    },
    generateKML() {
      const header =
        '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Run! Report</name><Style id="thickLine"><LineStyle><width>2.5</width></LineStyle></Style><Style id="transparent50Poly"><PolyStyle><color>7f3357c0</color></PolyStyle></Style><Placemark><name>' +
        this.name +
        "</name><description>" +
        this.name +
        " exported from Run!</description><LineString><coordinates>";
      let res = header;
      for (let i = 0; i < this.locations.length; i++) {
        res +=
          this.locations[i].longitude.toFixed(5) +
          "," +
          this.locations[i].latitude.toFixed(5) +
          "," +
          this.locations[i].altitude.toFixed(5) +
          " ";
      }
      const tail =
        "</coordinates></LineString><styleUrl>#thickLine</styleUrl></Placemark><Placemark><name>Start</name><description>Start point of " +
        this.name +
        "</description><Point><coordinates>" +
        this.locations[0].longitude.toFixed(5) +
        "," +
        this.locations[0].latitude.toFixed(5) +
        "," +
        this.locations[0].altitude.toFixed(5) +
        "</coordinates></Point></Placemark><Placemark><name>Finish</name><description>Finish point of " +
        this.name +
        "</description><Point><coordinates>" +
        this.locations[this.locations.length - 1].longitude.toFixed(5) +
        "," +
        this.locations[this.locations.length - 1].latitude.toFixed(5) +
        "," +
        this.locations[this.locations.length - 1].altitude.toFixed(5) +
        "</coordinates></Point></Placemark></Document></kml>";
      return res + tail;
    },
    getPreview() {
      let locations = this.locations;
      const head =
        '{"type": "FeatureCollection","features":[{"type":"Feature","properties":{"stroke": "#3357c0","stroke-width": 3,"stroke-opacity":1},"geometry":{"type":"LineString","coordinates":[';
      const tail =
        ']}},{"type":"Feature","properties":{"marker-color":"#657786","marker-size":"large","marker-symbol":"pitch"},"geometry":{"type":"Point","coordinates": [' +
        locations[0].longitude.toFixed(5) +
        "," +
        locations[0].latitude.toFixed(5) +
        ']}},{"type":"Feature","properties":{"marker-color":"#1da1f2","marker-size":"large","marker-symbol":"star"},"geometry":{"type":"Point","coordinates":[' +
        locations[locations.length - 1].longitude.toFixed(5) +
        "," +
        locations[locations.length - 1].latitude.toFixed(5) +
        "]}}]}";
      let url = head;
      let multiplier = 1;
      if (locations.length > 250) {
        multiplier = locations.length / 250;
      }
      let index = 0;
      let i = 0;
      while (Math.floor(index) < locations.length) {
        i = Math.floor(index);
        url +=
          "[" +
          locations[i].longitude.toFixed(5) +
          "," +
          locations[i].latitude.toFixed(5) +
          "]";
        index += multiplier;
        if (Math.floor(index) < locations.length) {
          url += ",";
        }
      }
      url += tail;
      url = escape(url);
      url =
        "https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/geojson(" +
        url +
        ")/auto/800x800?access_token=" +
        this.accessToken;
      return url;
    },
  },
  mounted() {
    console.log(this.generateKML());
    console.log(this.generateGeoJSON());
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
  border-color: rgba(225, 232, 237, 0.4);
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
  border-color: rgba(225, 232, 237, 0.4);
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

.second-slide {
  margin-top: 10;
  margin-right: 10;
  margin-left: 10;
}

.small-carousel-icon {
  color: #e1e8ed;
  font-size: 60;
  opacity: 0.4;
  text-align: center;
  width: 50%;
  height: 75;
  padding-top: 10px;
}

.big-label-top-left {
  width: 50%;
  padding-top: 10;
  font-size: 30;
  color: white;
  text-align: center;
  height: 75;
  font-weight: bold;
  border-color: rgba(225, 232, 237, 0.4);
  border-width: 0 1 1 0;
}

.big-label-bottom-right {
  width: 50%;
  padding-top: 10;
  font-size: 30;
  color: white;
  text-align: center;
  height: 75;
  font-weight: bold;
  border-color: rgba(225, 232, 237, 0.4);
  border-width: 1 0 0 1;
}

.big-label-bottom-left {
  width: 50%;
  padding-top: 10;
  font-size: 30;
  color: white;
  text-align: center;
  height: 75;
  font-weight: bold;
  border-color: rgba(225, 232, 237, 0.4);
  border-width: 1 1 0 0;
}

.big-label-top-right {
  width: 50%;
  padding-top: 10;
  font-size: 30;
  color: white;
  text-align: center;
  height: 75;
  font-weight: bold;
  border-color: rgba(225, 232, 237, 0.4);
  border-width: 0 0 1 1;
}
</style>
