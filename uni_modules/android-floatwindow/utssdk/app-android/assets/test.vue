<template>
  <view>
    <view class="content">
    	<view id="paragraph">
			{{title}}
    	</view>
    	<view class="close_btn" @click="onClick">
    		<image  id="close" style="width: 30px;height: 30px;"/>
    	</view>
    </view>
	
  </view>
</template>
<style>
	.content{
		background-color: green;
		border-radius: 10px;
		margin: 0px;
		padding: 0px;
		color: white;
		width: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
	}
	.close_btn{
		position: absolute;
		right: 10px;
		top: 10px;
	}
	
</style>
<script>
export default {
	data() {
		return {
			title: ''
		}
	},
  mounted() {
    window.dataFromUniapp = this.dataFromUniapp;
  },
  methods: {
		onClick(){
			uniapp.sendDataToUni(0,"")
		},
	   dataFromUniapp(type,msg){
	  	console.log(type,msg);
	  	  // var paragraph = document.getElementById("paragraph");
	  	 this.title =type+ msg;
		}
	  
    // receiveAndroidMsg(str) {
    //   console.log("Android 消息:", str);
    // },
    // callAndroid() {
    //   if (window.AndroidBridge) {
    //     const reply = window.AndroidBridge.handleMessage("Vue 请求");
    //     console.log("Android 回复:", reply);
    //   }
    // }
  }
};
</script>