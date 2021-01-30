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
      <Gridlayout columns="*,100" class="settings-entry">
        <Label col="0" class="settings-label">export as kml</Label>
        <Switch
          v-model="useKMLFormat"
          col="1"
          @checkedChange="saveExportFormat"
          class="settings-switch"
        />
      </Gridlayout>
      <Gridlayout columns="*,100" class="settings-entry">
        <Label col="0" class="settings-label">No map mode</Label>
        <Switch
          v-model="noMapMode"
          col="1"
          @checkedChange="toggleMap"
          class="settings-switch"
        />
      </Gridlayout>
      <Button @tap="exportHistory" class="export-button">Export History</Button>
      <Button @tap="pickFile" class="export-button">Import History</Button>
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
const fs = require("tns-core-modules/file-system");
const permissions = require("nativescript-permissions");
import {
  Mediafilepicker,
  FilePickerOptions,
} from "nativescript-mediafilepicker";

export default {
  name: "Settings",
  data() {
    return {
      altSpeedSettings: appSettings.getBoolean("altSpeedSettings", false),
      useKMLFormat: appSettings.getBoolean("useKMLFormat", false),
      noMapMode: appSettings.getBoolean("noMapMode", false),
    };
  },
  methods: {
    saveSpeed() {
      appSettings.setBoolean("altSpeedSettings", this.altSpeedSettings);
    },
    saveExportFormat() {
      appSettings.setBoolean("useKMLFormat", this.useKMLFormat);
    },
    toggleMap() {
      appSettings.setBoolean("noMapMode", this.noMapMode);
    },
    onDrawerButtonTap() {
      utils.showDrawer();
    },
    exportHistory() {
      let StringToExport = appSettings.getString("runs", "[]");
      permissions
        .requestPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
        .then(() => {
          const sdDownloadPath = android.os.Environment.getExternalStoragePublicDirectory(
            android.os.Environment.DIRECTORY_DOWNLOADS
          ).toString();
          const folder = fs.Folder.fromPath(fs.path.join(sdDownloadPath, ""));
          const regex = /\\*\/*:*\**\?*<*>*\|*\.*/g;
          let safeName = new Date().toDateString().replace(regex, "");
          const file = folder.getFile(safeName + ".txt");
          file.writeText(StringToExport).then(() => {
            alert("Export successful");
          });
        })
        .catch((err) => {
          alert(err);
        });
    },
    pickFile() {
      let extensions = ["txt"];

      let options = {
        android: {
          extensions: extensions,
          maxNumberFiles: 1,
        },
        ios: {
          extensions: extensions,
          multipleSelection: false,
        },
      };

      let mediafilepicker = new Mediafilepicker();
      mediafilepicker.openFilePicker(options);

      mediafilepicker.on("getFiles", function(res) {
        let results = res.object.get("results");
        let file = fs.File.fromPath(results[0].file);
        file
          .readText()
          .then((res) => {
            let oldHistory = JSON.parse(appSettings.getString("runs", "[]"));
            let exportHistory = JSON.parse(res);
            for (let i = 0; i < exportHistory.length; i++) {
              oldHistory.push(exportHistory[i]);
            }
            appSettings.setString("runs", JSON.stringify(oldHistory));
            alert("imported " + exportHistory.length + " run(s)");
          })
          .catch((err) => alert(err));
      });

      mediafilepicker.on("error", function(res) {
        let msg = res.object.get("msg");
        console.log(msg);
      });

      mediafilepicker.on("cancel", function(res) {
        let msg = res.object.get("msg");
        console.log(msg);
      });
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
