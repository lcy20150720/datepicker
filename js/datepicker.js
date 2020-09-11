// +--------------------------------------------------------------------------------------
// | datepicker.js
// +--------------------------------------------------------------------------------------
// | time：2020-08-25
// +--------------------------------------------------------------------------------------
// | Author: lcy
// +--------------------------------------------------------------------------------------
// | 使用：
// |  	引入js文件，调用方法如下：
// |  	var datePicker = new DatePicker({
// |  		mode:'single',					//传入日历选择类型['single':单选]、['range':多选]
// |  		month: 2,						//传入日历创建月份个数
// |  		attachTo: document.body,		//添加到的目标容器
// |  		selLabels:['出发'],				//选中显示的文字数组[单选只传1个，多选传2个]
// |  		selDates:[],					//选中的日期数组
// |		isShow: false,					//是否显示
// |  		selectionType: 'callback',		//回调类型
// |		onSelection: function(res){}	//参数为选中日期数组,有传回调类型时调用，没则关闭弹窗
// |  	});
// |  	
// +---------------------------------------------------------------------------------------

var DatePicker = (function(){
	function datePicker(option){
		this.mode = option.mode || 'single'; 	//单选日历'single',选区日历'range'
		this.month = option.month || 1; 		//单个月参数1，双月份参数2
		this.attachTo = option.attachTo || ''; 	//容器
		this.selLabels = option.selLabels || [];//选中设置文字标签
		this.selDates = option.selDates || []; 	//选中的日期
		this.isShow = option.isShow || false;
		this.selectionType = option.selectionType || 'callback'; //回调类型
		this.onSelection = option.onSelection || null; //选中后回调函数
		this.curYear = new Date().getFullYear();//年
		this.curMonth = new Date().getMonth()+1;//月
		this.curDate = new Date().getDate();	//日
		this.selArea =[]; 						//选区范围
	}
	datePicker.prototype ={
		init: function(){
			this.create();
		},
		create: function(){
			//根容器
			var rootTmp = document.createElement('div');
			rootTmp.classList.add('jm-datepicker');
                        if(this.mode == 'range'){
				rootTmp.classList.add('jm-datepicker-range');
			}else{
				rootTmp.classList.add('jm-datepicker-single');
			}
			if(!this.isShow){
				rootTmp.classList.add('jm-datepicker-hide');
			}
			this.rootTmp = rootTmp;

			var panelWrap = document.createElement('div');
			panelWrap.classList.add('jm-panel-wrap');

			//创建多少个月份
			if(this.month !=''){
				for(var i=0; i<this.month; i++){
					panelWrap.appendChild(this.createPanel());
				}
			}
			this.panelEls = panelWrap;

			// 根容器添加左右控制箭头及月份版块
			rootTmp.appendChild(panelWrap);
			rootTmp.appendChild(this.createLeftCtrl());
			rootTmp.appendChild(this.createRightCtrl());

			//添加到容器中
			if(this.attachTo !=''){
				var datePicker;
				if(this.mode == 'range'){
					datePicker = document.querySelector('.jm-datepicker-range');
				}else{
					datePicker = document.querySelector('.jm-datepicker-single');
				}
				if(datePicker == null){
					this.attachTo.appendChild(rootTmp);
				}else{
					if(datePicker.className.indexOf('jm-datepicker-hide')!=-1){
						datePicker.classList.remove('jm-datepicker-hide');
					}
				}
			}
			this.refresh(this.curMonth);
			this.bindEvent();
		},
		//创建月份
		createPanel:function(){
			var panel = document.createElement('div');
			panel.classList.add('jm-panel');
			panel.appendChild(this.createMonthHead());
			panel.appendChild(this.createMonthBody());
			return panel;
		},
		//创建左箭头
		createLeftCtrl: function(){
			var leftCtrl = document.createElement('a');
			leftCtrl.classList.add('jm-control');
			leftCtrl.classList.add('prev-btn');
			leftCtrl.classList.add('jm-control-disabled');
			var svg = '<svg class="icon" aria-hidden="true" width="12px" height="12px">';
				svg+= '<use xlink:href="#icon-back" x="0" y="0" width="12px" height="12px"></use>';
				svg+= '</svg>';
			leftCtrl.innerHTML = svg;
			this.prevBtn = leftCtrl;
			return leftCtrl;
		},
		//创建右箭头
		createRightCtrl: function(){
			var rightCtrl = document.createElement('a');
			rightCtrl.classList.add('jm-control');
			rightCtrl.classList.add('next-btn');
			var svg = '<svg class="icon" aria-hidden="true" width="12px" height="12px">';
				svg+= '<use xlink:href="#icon-right" x="0" y="0" width="12px" height="12px"></use>';
				svg+= '</svg>';
			rightCtrl.innerHTML = svg;
			this.nextBtn = rightCtrl;
			return rightCtrl;
		},
		//创建月份头部
		createMonthHead: function(){
			var panelHead = document.createElement('div');
			panelHead.classList.add('jm-panel-head');
			var headTmp= '<h3>';
				headTmp+= '<span class="yy-txt"></span>年';
				headTmp+= '<span class="mm-txt"></span>月';
				headTmp+= '</h3>';
			panelHead.innerHTML = headTmp;
			return panelHead;
		},
		//创建月份头部星期
		createWeekBar: function(){
			var weekStr = ['日','一','二','三','四','五','六'];
			var weekBar = document.createElement('div');
			weekBar.classList.add('jm-panel-weekbar');
			var tmp ='';
			for(var i=0; i<weekStr.length; i++){
				tmp +='<span>'+weekStr[i]+'</span>';
			}
			weekBar.innerHTML=tmp;
			return weekBar;
		},
		//创建日期格子
		createDateGrid: function(){
			var datesWrap = document.createElement('div');
			datesWrap.classList.add('jm-panel-dates');
			datesWrap.classList.add('clearfix');

			var cols = 7;//7列
			var rows = 6;//6行
			for(var i=0; i<rows; i++){
				for(var j=0; j<cols; j++){
					var dateBox = document.createElement('div');
					dateBox.classList.add('jm-date-box');
					datesWrap.appendChild(dateBox);
				}
			}
			return datesWrap;
		},
		//创建月份内容（头部星期+日期内容）
		createMonthBody: function(){
			var con = document.createElement('div');
			con.classList.add('jm-panel-body');
			con.appendChild(this.createWeekBar());
			con.appendChild(this.createDateGrid());
			return con;
		},
		refresh: function(){

			var _this = this
