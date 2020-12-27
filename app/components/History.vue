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
      <Label text="History" class="action-label"></Label>
    </ActionBar>
    <PullToRefresh
      @refresh="refreshList"
      indicatorFillColor="#1da1f2"
      indicatorColor="#ffffff"
    >
      <ListView for="(run,runIndex) in runs" separatorColor="transparent">
        <v-template>
          <AbsoluteLayout>
            <GridLayout
              top="20"
              left="20"
              columns="*, 80"
              rows="100, 50, 30"
              class="run-prev"
              @tap="onItemTap(runIndex)"
            >
              <Image
                :src="getPreview(run.locations)"
                height="100"
                row="0"
                column="0"
                colSpan="2"
                stretch="fill"
              />
              <Label class="run-label" :text="run.name" col="0" row="1" />
              <Label
                class="run-infos"
                :text="run.chrono + ' - ' + run.distance"
                col="0"
                row="2"
              />
              <Button
                text.decode="&#xf1f8;"
                @tap="deleteRun(runIndex)"
                class="fas"
                row="1"
                rowSpan="2"
                col="1"
              ></Button>
            </GridLayout>
          </AbsoluteLayout>
        </v-template>
      </ListView>
    </PullToRefresh>
  </Page>
</template>

<script>
import * as utils from "~/shared/utils";
import SelectedPageService from "../shared/selected-page-service";
const appSettings = require("tns-core-modules/application-settings");
import { getString, setString } from "@nativescript/core/application-settings";
const ObservableArray = require("tns-core-modules/data/observable-array")
  .ObservableArray;
import { mapboxToken } from "../secret.js";
import runDisplay from "./runDisplay";

export default {
  name: "History",
  data() {
    return {
      runs: new ObservableArray([]),
      accessToken: mapboxToken,
    };
  },
  mounted() {
    SelectedPageService.getInstance().updateSelectedPage("History");
    this.runs = new ObservableArray(
      JSON.parse(appSettings.getString("runs", "[]"))
    );
  },
  methods: {
    onDrawerButtonTap() {
      utils.showDrawer();
    },
    onItemTap(index) {
      console.log(index);
      this.$navigateTo(runDisplay, {
        props: {
          data: this.runs.getItem(index),
        },
      });
    },
    refreshList(args) {
      var pullRefresh = args.object;
      this.runs = new ObservableArray(
        JSON.parse(appSettings.getString("runs", "[]"))
      );
      pullRefresh.refreshing = false;
    },
    deleteRun(index) {
      confirm(
        "Are you sure you want to delete " + this.runs.getItem(index).name
      ).then((result) => {
        if (result) {
          this.runs.splice(index, 1);
          appSettings.setString(
            "runs",
            JSON.stringify(
              this.runs.map((x) => {
                return x;
              })
            )
          );
        }
      });
    },
    getPreview(locations) {
      const horribleTextPt1 =
        '{"type": "FeatureCollection","features":[{"type":"Feature","properties":{"stroke": "#3357c0","stroke-width": 3,"stroke-opacity":1},"geometry":{"type":"LineString","coordinates":[';
      const horribleTextPt2 = "]}}]}";
      let url = horribleTextPt1;
      for (let i = 0; i < locations.length; i++) {
        url += "[" + locations[i].longitude + "," + locations[i].latitude + "]";
        if (i != locations.length - 1) {
          url += ",";
        }
      }
      url += horribleTextPt2;
      url = escape(url);
      url =
        "https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/geojson(" +
        url +
        ")/auto/400x105?access_token=" +
        this.accessToken;
      return url;
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

.run-prev {
  height: 180;
  width: 90%;
  background-color: white;
  border-radius: 20px;
}

.run-label {
  font-size: 20px;
  padding-left: 10;
  padding-top: 10;
  font-weight: bold;
  color: #1da1f2;
}

.run-infos {
  color: #14171a;
  padding-left: 10;
}

button {
  color: white;
  background-color: #14171a;
  font-size: 25px;
  height: 70;
  width: 70;
}

ListView {
  background-color: #e1e8ed;
}
</style>
