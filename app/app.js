import Vue from "nativescript-vue";
import VueDevtools from "nativescript-vue-devtools";
import App from "./components/App";
import Run from "./components/Run";
import DrawerContent from "./components/DrawerContent";
import RadSideDrawer from "nativescript-ui-sidedrawer/vue";
Vue.use(RadSideDrawer);
Vue.registerElement(
  "Carousel",
  () => require("nativescript-carousel").Carousel
);
Vue.registerElement(
  "CarouselItem",
  () => require("nativescript-carousel").CarouselItem
);

Vue.use(VueDevtools);

Vue.registerElement("Mapbox", () => require("nativescript-mapbox").MapboxView);

Vue.registerElement(
  "PullToRefresh",
  () => require("@nstudio/nativescript-pulltorefresh").PullToRefresh
);

import {
  ModalStack,
  overrideModalViewMethod,
  VueWindowedModal,
} from "nativescript-windowed-modal";

overrideModalViewMethod();
Vue.registerElement("ModalStack", () => ModalStack);
Vue.use(VueWindowedModal);

Vue.config.silent = TNS_ENV === "production";

new Vue({
  render(h) {
    return h(App, [
      h(DrawerContent, { slot: "drawerContent" }),
      h(Run, { slot: "mainContent" }),
    ]);
  },
}).$start();
