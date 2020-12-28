ht<template>
  <Page>
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
      <Label text="Settings" class="action-label"></Label>
    </ActionBar>
    <StackLayout>
      <GridLayout columns="*,100" class="settings-entry">
        <Label col="0" class="settings-label">Km/min speed notation</Label>
        <Switch
          v-model="altSpeedSettings"
          col="1"
          @checkedChange="saveSpeed"
          class="settings-switch"
        />
      </GridLayout>
      <GridLayout columns="*,100" class="settings-entry">
        <Label col="0" class="settings-label">Export as KML</Label>
        <Switch
          v-model="useKMLFormat"
          col="1"
          @checkedChange="saveExportFormat"
          class="settings-switch"
        />
      </GridLayout>
    </StackLayout>
  </Page>
</template>

<script>
import * as utils from "~/shared/utils";
import SelectedPageService from "../shared/selected-page-service";
const appSettings = require("tns-core-modules/application-settings");
import {
  getBoolean,
  setBoolean,
} from "@nativescript/core/application-settings";

export default {
  name: "Settings",
  data() {
    return {
      altSpeedSettings: appSettings.getBoolean("altSpeedSettings", false),
      useKMLFormat: appSettings.getBoolean("useKMLFormat", false),
    };
  },
  methods: {
    saveSpeed() {
      appSettings.setBoolean("altSpeedSettings", this.altSpeedSettings);
    },
    saveExportFormat() {
      appSettings.setBoolean("useKMLFormat", this.useKMLFormat);
    },
    onDrawerButtonTap() {
      utils.showDrawer();
    },
  },
  mounted() {
    SelectedPageService.getInstance().updateSelectedPage("Settings");
  },
};
</script>

<style scoped>
.action-label {
  color: white;
  font-size: 24;
  font-weight: bold;
  vertical-align: center;
}

GridLayout {
  height: 55;
}

label {
  padding: 10;
  font-size: 20;
}

Switch {
  color: #1da1f2;
}
</style>
