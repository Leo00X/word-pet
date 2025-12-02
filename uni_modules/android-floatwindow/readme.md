# android-floatwindow
### 长期维护，有任何问题在插件群联系
### [推荐作者保活插件一起使用](https://ext.dcloud.net.cn/plugin?id=20316)
### 功能介绍 
1. 支持不申请权限时 当前app  全局页面弹窗
申请权限时 退出app 和app 时均显示
2. 浮窗可以设置拖动
3. 浮窗可以自定义大小 网页px 转换android px 使其大小对应
4. h5 网页直接透传消息到uniapp 代码，相互交互

#### 插件测试使用方法
1. 选择试用，绑定要试用的项目appid，

2. 选择后下载到对应的本地项目，

3. 按照文档 -》把插件引入项目（即 import {FloatWindow} from "@/uni_modules/android-floatwindow" 需要先引入），

4. 发布-》云打包-》选择制作基座-》打包等基座制作完成 

5. 运行 -》 运行到手机或模拟器-》运行到Androidapp基座-》选择使用自定义基座运行-》选择手机-》运行

6. 之前若安装过基座 ，请卸载之前的基座

测试请注意 内置网页需要每次打基座才能生效，测试时请用电脑添加网页映射，即 采用window.loadUrl("http://192.16.8.x.x:8080/test.html")  这种方式加载url 能够修改实时变化，不用每次打基座
uniappx

~~~ 
	<template>
	<view>
		<button type="primary" class="btn" @click="onClick(0)"  >检测浮窗权限</button>
		<button type="primary" class="btn" @click="onClick(1)">申请浮窗权限</button>
		<button type="primary" class="btn" @click="onClick(2)">显示h5浮窗</button>
		<button type="primary" class="btn"   @click="onClick(3)">隐藏h5浮窗</button>
		<button type="primary" class="btn"   @click="onClick(6)">发送数据到js</button>
		<button type="primary" class="btn" @click="onClick(4)">显示浮窗球</button>
		<button type="primary" class="btn"   @click="onClick(5)">隐藏浮窗球</button>
		<button type="primary" class="btn"   @click="onClick(7)">显示一像素保活</button>
		<button type="primary" class="btn"   @click="onClick(8)">隐藏一像素保活</button>
		
	</view>
</template>

<script>
	import {FloatWindow} from "@/uni_modules/android-floatwindow"
	
	var window:FloatWindow=new FloatWindow();
	export default {
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {
			
			window!.onSetWebViewConsole(function(res:string){
				console.log(res);
			})
		
		},
		methods: {
			onClick(type:number){
				if(type==0){
					var b=window!.checkPermission();
					uni.showToast({
						icon:"none",
						title:""+b
						
					})
				}else if(type==1){
					 window!.requestPermision(function(state:boolean){
						uni.showToast({
							icon:"none",
							title:""+state,
					 	})
						
					 })
					
				//	window!.goNotifationSetting();
					
				}else if(type==2){
					window!.loadUrl("http://192.168.1.161:5173/#/pages/test/test")
					// window!.loadUrl("file:///android_asset/test.html");
					window!.setFixedWidthHeight(true,window!.convertHtmlPxToAndroidPx(300),window!.convertHtmlPxToAndroidPx(200))
					window!.setGravity(4)
					// window!.hasEditText(f);
					window!.onListenerWebData(function(type:number,data:string){
						if(type==0){
							window!.dismiss();
							
						}
						
					})
					window!.createAndShow();
					
				}else if(type==3){
					window!.dismiss();
				}else if(type==4){
					window!.loadUrl("file:///android_asset/ball.html");
					window!.setFixedWidthHeight(true,window!.convertHtmlPxToAndroidPx(80),window!.convertHtmlPxToAndroidPx(80))
					window!.setGravity(5);
					window!.setShowPattern(3);
					// window!.hasEditText(true);
					window!.setSidePattern(12)
					window!.onListenerWebData(function(type:number,data:string){
						if(type==1){
									window!.setFixedWidthHeight(true,window!.convertHtmlPxToAndroidPx(300),window!.convertHtmlPxToAndroidPx(200))
										window!.loadUrl("file:///android_asset/test.html");
										window!.setGravity(4);
										// window!.hasEditText(true);
										window!.updateWindow();
						}else if(type==0){
							window!.loadUrl("file:///android_asset/ball.html");
							window!.setFixedWidthHeight(true,window!.convertHtmlPxToAndroidPx(80),window!.convertHtmlPxToAndroidPx(80))
							// window!.hasEditText(true);
							window!.setShowPattern(3);
							window!.setSidePattern(12)
							window!.setGravity(5);
							window!.updateWindow();
						}
						
					})
					window!.createAndShow();
				}else if(type==5){
					window!.dismiss();
				}else if(type==6){
					window!.sendDataToJs(1,"hello uniapp ");
				}else if(type==7){
					window!.showOnePxWindow(true);
				}else if(type==8){
					window!.showOnePxWindow(false);
				}
				
			}
		}
	}
</script>

<style>
	.btn{
		margin: 10rpx;
	}
</style>

~~~
uniapp
~~~   
<template>
	<view>
		<button type="primary" class="btn" @click="onClick(0)"  >检测浮窗权限</button>
		<button type="primary" class="btn" @click="onClick(1)">申请浮窗权限</button>
		<button type="primary" class="btn" @click="onClick(2)">显示h5浮窗</button>
		<button type="primary" class="btn"   @click="onClick(3)">隐藏h5浮窗</button>
		<button type="primary" class="btn"   @click="onClick(6)">发送数据到js</button>
		<button type="primary" class="btn" @click="onClick(4)">显示浮窗球</button>
		<button type="primary" class="btn"   @click="onClick(5)">隐藏浮窗球</button>
		<button type="primary" class="btn"   @click="onClick(7)">显示一像素保活</button>
		<button type="primary" class="btn"   @click="onClick(8)">隐藏一像素保活</button>
		
	</view>
</template>

<script>
	import {FloatWindow} from "@/uni_modules/android-floatwindow"
	
	var window=new FloatWindow();
	export default {
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {
			window.onSetWebViewConsole(function(res){
				console.log(res);
			})
		},
		methods: {
			onClick(type){
				if(type==0){
					var b=window.checkPermission();
					uni.showToast({
						icon:"none",
						title:""+b
						
					})
				}else if(type==1){
					 window.requestPermision(function(state:boolean){
						uni.showToast({
							icon:"none",
							title:""+state,
					 	})
						
					 })
					
				//	window!.goNotifationSetting();
					
				}else if(type==2){
					window.loadUrl("file:///android_asset/test.html");
					window.hasEditText(true)
					window.setFixedWidthHeight(true,window.convertHtmlPxToAndroidPx(300),window.convertHtmlPxToAndroidPx(200))
					window.setGravity(4)
					window.onListenerWebData(function(type,data){
						if(type==0){
							window.dismiss();
							
						}
						
					})
					window.createAndShow();
					
				}else if(type==3){
					window.dismiss();
				}else if(type==4){
					window.loadUrl("file:///android_asset/ball.html");
					window.setFixedWidthHeight(true,window.convertHtmlPxToAndroidPx(80),window.convertHtmlPxToAndroidPx(80))
					window.setGravity(5);
					window.setShowPattern(3);
					window.setSidePattern(12)
					window.onListenerWebData(function(type,data){
						if(type==1){
									window.setFixedWidthHeight(true,window.convertHtmlPxToAndroidPx(300),window.convertHtmlPxToAndroidPx(200))
										window.loadUrl("file:///android_asset/test.html");
										window.setGravity(4);
										window.hasEditText(true)
										window.updateWindow();
						}else if(type==0){
							window.loadUrl("file:///android_asset/ball.html");
							window.setFixedWidthHeight(true,window.convertHtmlPxToAndroidPx(80),window.convertHtmlPxToAndroidPx(80))
							
							window.setShowPattern(3);
							window.setSidePattern(12)
							window.setGravity(5);
							window.updateWindow();
						}
						
					})
					window.createAndShow();
				}else if(type==5){
					window.dismiss();
				}else if(type==6){
					window.sendDataToJs(1,"hello uniapp ");
				}else if(type==7){
					window.showOnePxWindow(true);
				}else if(type==8){
					window.showOnePxWindow(false);
				}
				
			}
		}
	}
</script>

<style>
	.btn{
		margin: 10rpx;
	}
</style>

~~~



h5 使用介绍
~~~ 
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>window</title>
</head>
<!-- 这里需要去掉边框  否则可能出现滑动 -->
<body style="margin: 0px;padding: 0px;" >
<div class="content">
	<div id="paragraph">
		这是一个浮窗h5
	</div>
	<div class="close_btn">
		<img  id="close" src="close.png" style="width: 30px;height: 30px;"/>
	</div>
</div>

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
	 
	// 为按钮添加点击事件监听器
	document.getElementById('close').addEventListener('click', function() {
	    uniapp.sendDataToUni(0,"")
	});
	
	function dataFromUniapp(type,msg){
		console.log(type,msg);
		  var paragraph = document.getElementById("paragraph");
		  paragraph.textContent =type+ msg;
	}
	
</script>

</body>
</html>
~~~


vue 使用介绍 vue 不能放在本地  需要部署到服务器才行
~~~
<template>
  <view>
    <view class="content">
    	<view id="paragraph">
			{{title}}
    	</view>
    	<view class="close_btn" @click="onClick">
    		<image  id="close" src="/logo.png" style="width: 30px;height: 30px;"/>
    	</view>
    </view>
	
  </view>
</template>

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
  }
};
</script>


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
~~~


### api 介绍



###  设置是否固定宽高
#### setFixedWidthHeight
参数1 boolean  为true 时生效

参数2 number  宽

参数3 number 高
~~~
window.setFixedWidthHeight(true,window.convertHtmlPxToAndroidPx(300),window.convertHtmlPxToAndroidPx(200))
~~~

### 设置位置 不可与setGravity共存
#### setLocation
参数1 number x 位置

参数2 number y 位置
~~~
window.setLocation(window.convertHtmlPxToAndroidPx(300),window.convertHtmlPxToAndroidPx(300))
~~~

### 设置是否超过状态栏
#### setImmersionStatusBar
参数1 boolean 
~~~
window.setImmersionStatusBar(true)
~~~


### 设置对齐位置
#### setGravity
 参数1  number  0-8 分别对应 上左 上中 上右 中左 中中 中右   下左 下中 下右
 
 ~~~
 window.setGravity(0)
 ~~~
 
### 设置对齐位置 
 #### setGravityMore
参数1  number  0-8 分别对应 上左 上中 上右 中左 中中 中右   下左 下中 下右

参数2 number  x 偏移

参数3 number  y 偏移


 ~~~
 window.setGravityMore(4,window.convertHtmlPxToAndroidPx(100),window.convertHtmlPxToAndroidPx(300))
 ~~~

### 设置是否可以拖动
#### setDragEnable
参数1 boolean 
 ~~~
 window.setDragEnable(true)
 ~~~


### 设置拖动范围
#### setBorder
参数1 number 左

参数2 number 上

参数3 number 右

参数1 number 下
 ~~~
 window.setBorder(0,0,100,100)
 ~~~

### 创建并显示
#### createAndShow
 ~~~
 window.createAndShow()
 ~~~

### 取消
#### dismiss
~~~
 window.dismiss()
 ~~~


### 显示
#### show
~~~
 window.show()
 ~~~
### 隐藏
#### hide

~~~
 window.hide()
 ~~~
### 是否已经显示
#### isShow

~~~
var show= window.isShow()
 ~~~

### 更新窗口内容(已经显示的窗口更新内容)
#### updateWindow
~~~
 window.updateWindow()
 ~~~


#### 设置显示方式
#### setShowPattern
参数1  number  0当前应用显示（无需权限）  1 前台显示   2 后台显示  3  一直显示
~~~
 window.setShowPattern(3)
 ~~~
###  设置滑动样式
#### setSidePattern
参数1  number  0~14  效果自行测试
~~~
 window.setShowPattern(0)
 ~~~
 ### 网页px 转换android px
 #### convertHtmlPxToAndroidPx
 return  number  androd px
 参数1 number  网页px
 ~~~
var b=  window.convertHtmlPxToAndroidPx(0)
  ~~~
 
 ### 检查是否有浮窗权限
 #### checkPermission
 return 是否有浮窗权限
 
 
 ~~~
 var b=  window.checkPermission()
   ~~~
 
 ### 网页数据传输到uniapp
 #### onListenerWebData
 参数1 为回调方法      回调 参数1 number  参数2 string 
uniapp
 ~~~
 window.onListenerWebData(function(res1,res2){
	 
 })
~~~
 uniappx
  ~~~
  window.onListenerWebData(function(res1:number,res2:number){
 	 
  })
 ~~~


### 启动应用
### startApp
参数1 启动应用的包名
~~~
window.startApp(window.getPkgName())
~~~
 
 
 
 ### 申请浮窗权限
 #### 
### 显示/隐藏一像素浮窗
####  showOnePxWindow;
~~~
window.showOnePxWindow(true);// 显示/隐藏浮窗
~~~

### 网页console 消息监听
uniappx
```javascript
window!.onSetWebViewConsole(function(res:string){
	console.log(res);
})
```
uniapp
```javascript
window.onSetWebViewConsole(function(res){
	console.log(res);
})
```

### 开发文档
[UTS 语法](https://uniapp.dcloud.net.cn/tutorial/syntax-uts.html)
[UTS API插件](https://uniapp.dcloud.net.cn/plugin/uts-plugin.html)
[UTS 组件插件](https://uniapp.dcloud.net.cn/plugin/uts-component.html)
[Hello UTS](https://gitcode.net/dcloud/hello-uts)