<template lang="html">
  <GridLayout rows="auto, *">
    <StackLayout row="0">
      <Label text.decode="&#xf70c;" class="fas title-icon"></Label>
    </StackLayout>

    <ScrollView row="1" class="nt-drawer__body">
      <StackLayout>
        <GridLayout
          columns="auto, *"
          :class="selectedPage === 'Run' ? 'menu-selected' : 'menu-item'"
          @tap="onNavigationItemTap(Run)"
        >
          <Label col="0" text.decode="&#xf2f2;" class="fas menu-icon" />
          <Label col="1" text="Run" class="menu-text" />
        </GridLayout>
        <GridLayout
          columns="auto, *"
          :class="selectedPage === 'History' ? 'menu-selected' : 'menu-item'"
          @tap="onNavigationItemTap(History)"
        >
          <Label col="0" text.decode="&#xf1da;" class="fas menu-icon" />
          <Label col="1" text="History" class="menu-text" />
        </GridLayout>
        <GridLayout
          columns="auto, *"
          :class="selectedPage === 'Settings' ? 'menu-selected' : 'menu-item'"
          @tap="onNavigationItemTap(Settings)"
        >
          <Label col="0" text.decode="&#xf013;" class="fas menu-icon" />
          <Label col="1" text="Settings" class="menu-text" />
        </GridLayout>
      </StackLayout>
    </ScrollView>
  </GridLayout>
</template>

<script>
import Run from "./Run";
import History from "./History";
import Settings from "./Settings";
import * as utils from "~/shared/utils";
import SelectedPageService from "~/shared/selected-page-service";

export default {
  mounted() {
    SelectedPageService.getInstance().selectedPage$.subscribe(
      (selectedPage) => (this.selectedPage = selectedPage)
    );
  },
  data() {
    return {
      Run: Run,
      History: History,
      Settings: Settings,
      selectedPage: "",
    };
  },
  components: {
    Run,
    History,
    Settings,
  },
  methods: {
    onNavigationItemTap(component) {
      this.$navigateTo(component, {
        clearHistory: true,
      });
      utils.closeDrawer();
    },
  },
};
</script>

<style scoped>
.title-icon {
  font-size: 100px;
  background-color: #1da1f2;
  color: white;
  height: 200;
  text-align: center;
  padding: 50;
}

.menu-selected {
  background-color: #657786;
  color: white;
  height: 50;
}

.menu-item {
  background-color: white;
  color: #657786;
  height: 50;
}

.menu-icon {
  font-size: 20;
  margin-left: 30px;
  margin-right: 30px;
  height: 50;
  padding: 13;
}

.menu-text {
  font-size: 20;
  margin: 0;
  height: 50;
  padding: 10;
}
</style>
