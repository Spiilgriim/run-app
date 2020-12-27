<template>
  <ModalStack dismissEnabled="true" showModally="onShowModally">
    <GridLayout rows="auto, auto, auto" columns="*,*">
      <Label row="0" col="0" colSpan="2">Well done!</Label>
      <TextField v-model="name" row="1" col="0" colSpan="2" />
      <Button row="2" col="0" class="cancel-button" @tap="cancel"
        >Delete</Button
      >
      <Button row="2" col="1" class="save-button" @tap="save">Save</Button>
    </GridLayout>
  </ModalStack>
</template>

<script>
export default {
  name: "saveModal",
  props: {
    defaultName: { type: String, default: "" },
  },
  data() {
    return {
      name: this.defaultName,
    };
  },
  methods: {
    save() {
      this.$modal.close({
        name: this.name,
        reset: false,
      });
    },
    cancel() {
      this.$modal.close({
        reset: true,
      });
    },
  },
};
</script>

<style scoped>
GridLayout {
  background-color: #f5f8fa;
  width: 80%;
  margin: auto;
}

label {
  text-align: center;
  font-size: 25px;
  font-weight: bold;
  color: #1da1f2;
  margin-bottom: 20;
}

TextField {
  margin-right: 50;
  margin-left: 50;
  margin-bottom: 10;
}

.save-button {
  color: white;
  background-color: #1da1f2;
}

.cancel-button {
  color: white;
  background-color: #14171a;
}
</style>
