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
		this.closeOnSelection = option.closeOnSelection || false; //选中后默认关闭弹层
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
				this.attachTo.appendChild(rootTmp);
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

			var _this = this;
			var month = this.curMonth;
			var yy,mm;
	
			if(month>12){
				if(month%12 == 0){
					yy = _this.curYear+parseInt(month/12)-1;
					mm = 12;
				}else{
					yy = this.curYear+parseInt(month/12);
					mm = month%12;
				}
			}else{
				yy = this.curYear;
				mm = month;
			}

			var dateList = []; //月份天数
			if(this.isLeapYear(yy)){
				dateList =[31,29,31,30,31,30,31,31,30,31,30,31];
			}else{
				dateList =[31,28,31,30,31,30,31,31,30,31,30,31];
			}

			// 查找日期格子
			if(this.month == 1){ //单日历情况
				var week = new Date(yy+'/'+mm+'/'+'1').getDay();//当前月1号星期几
				var curDates = dateList[mm-1]; //当前月份天数

				// 设置头部年月
				this.panelEls.querySelector('.yy-txt').innerHTML=yy;
				this.panelEls.querySelector('.mm-txt').innerHTML=mm;

				//查找所有日期格子
				var dateGroup =this.panelEls.querySelectorAll('.jm-date-box');
				if(dateGroup.length>0){
					for(var x=0; x<dateGroup.length; x++){
						if(x<week){
							dateGroup[x].innerHTML ='';
							dateGroup[x].classList.add('date-disabled');
						}else{
							if(x-week+1<curDates || x-week+1 == curDates){
								var childTmp = '<p class="sel-label"></p>';
								childTmp+= '<p class="fes-txt">'+_this.setFestText(mm,parseInt(x-week+1))+'</p>';
								childTmp+= '<p class="date-num">'+parseInt(x-week+1)+'</p>';
								dateGroup[x].innerHTML = childTmp;
								dateGroup[x].setAttribute('data-date',yy+'/'+mm+'/'+parseInt(x-week+1));

								//如果存在空格子样式去掉
								if(dateGroup[x].className.indexOf('date-disabled')!=-1){
									dateGroup[x].classList.remove('date-disabled');
								}
								//如果存在选中日期样式去掉
								if(dateGroup[x].className.indexOf('date-selected')!=-1){
									dateGroup[x].classList.remove('date-selected');
								}
								//如果存在选中日期加样式
								if(_this.selDates.length>0){
									var str = dateGroup[x].getAttribute('data-date');
									if(str == _this.selDates[0]){
										dateGroup[x].classList.add('date-selected');
									}
								}
							}else{
								dateGroup[x].innerHTML ='';
								dateGroup[x].classList.add('date-disabled');
							}
						}
					}
				}
			}else{ //双日历情况
				var ny,nm;
				if(parseInt(mm+1)>12){
					if(parseInt(mm+1)%12 == 0){
						nm = 12;
						ny = yy+parseInt((mm+1)/12)-1;
					}else{
						nm = parseInt(mm+1)%12;
						ny = yy+parseInt((mm+1)/12);
					}
				}else{
					nm = mm+1;
					ny = yy;
				}
				var week = new Date(yy+'/'+mm+'/'+'1').getDay();//当月1号星期几
				var nweek = new Date(ny+'/'+nm+'/'+'1').getDay();//下月1号星期几
				var curDates = dateList[mm-1]; //当月天数
				var ncurDates = dateList[nm-1]; //下月份天数

				// 左右版块日期内容
				var panels = this.panelEls.querySelectorAll('.jm-panel');
				if(panels.length>0){
					for(var i=0; i<panels.length; i++){
						(function(index){
							if(index == 0){
								// 设置头部年月
								panels[index].querySelector('.yy-txt').innerHTML = yy;
								panels[index].querySelector('.mm-txt').innerHTML = mm;

								var dateGroup = panels[index].querySelectorAll('.jm-date-box');
								if(dateGroup.length>0){
									for(var x=0; x<dateGroup.length; x++){
										if(x<week){
											dateGroup[x].innerHTML ='';
											dateGroup[x].classList.add('date-disabled');
											if(dateGroup[x].getAttribute('data-date')!=''){
												dateGroup[x].removeAttribute('data-date');
											}

											if(dateGroup[x].className.indexOf('date-selected')!=-1){
												dateGroup[x].classList.remove('date-selected');
												dateGroup[x].removeAttribute('data-date');
											}
										}else{
											if(x-week+1<curDates || x-week+1 == curDates){
												var childTmp = '<p class="sel-label"></p>';
												childTmp+= '<p class="fes-txt">'+_this.setFestText(mm, parseInt(x-week+1))+'</p>';
												childTmp+= '<p class="date-num">'+parseInt(x-week+1)+'</p>';
												dateGroup[x].innerHTML = childTmp;
												dateGroup[x].setAttribute('data-date',yy+'/'+mm+'/'+parseInt(x-week+1));

												if(dateGroup[x].className.indexOf('date-disabled')!=-1){
													dateGroup[x].classList.remove('date-disabled');
												}
												
												// 判断获得真实的月份
												var _curM = new Date().getMonth()+1;
												if(_curM>12){
													if(_curM%12 == 0){
														_curM = 12;
													}else{
														_curM = _curM%12;
													}
												}

												// 设置过去日期为灰色
												if(yy == _this.curYear){
													if(mm == _curM){
														if(parseInt(x-week+1)<_this.curDate){
															dateGroup[x].classList.add('date-past');
														}else{
															if(dateGroup[x].className.indexOf('date-past')!=-1){
																dateGroup[x].classList.remove('date-past');
															}
														}
													}else{
														if(dateGroup[x].className.indexOf('date-past')!=-1){
															dateGroup[x].classList.remove('date-past');
														}
													}
												}else{
													if(dateGroup[x].className.indexOf('date-past')!=-1){
														dateGroup[x].classList.remove('date-past');
													}
												}

											}else{
												dateGroup[x].innerHTML ='';
												dateGroup[x].classList.add('date-disabled');

												if(dateGroup[x].getAttribute('data-date')!=''){
													dateGroup[x].removeAttribute('data-date');
												}

												if(dateGroup[x].className.indexOf('date-selected')!=-1){
													dateGroup[x].classList.remove('date-selected');
													dateGroup[x].removeAttribute('data-date');
												}
											}
										}
									}
								}
							}else{
								// 设置头部年月
								panels[index].querySelector('.yy-txt').innerHTML = ny;
								panels[index].querySelector('.mm-txt').innerHTML = nm;

								var dateGroup = panels[index].querySelectorAll('.jm-date-box');
								if(dateGroup.length>0){
									for(var x=0; x<dateGroup.length; x++){
										if(x<nweek){
											dateGroup[x].innerHTML ='';
											dateGroup[x].classList.add('date-disabled');

											if(dateGroup[x].getAttribute('data-date')!=''){
												dateGroup[x].removeAttribute('data-date');
											}

											if(dateGroup[x].className.indexOf('date-selected')!=-1){
												dateGroup[x].classList.remove('date-selected');
												dateGroup[x].removeAttribute('data-date');
											}
										}else{
											if(x-nweek+1<ncurDates || x-nweek+1 == ncurDates){
												var childTmp = '<p class="sel-label"></p>';
												childTmp+= '<p class="fes-txt">'+_this.setFestText(nm, parseInt(x-nweek+1))+'</p>';
												childTmp+= '<p class="date-num">'+parseInt(x-nweek+1)+'</p>';
												dateGroup[x].innerHTML = childTmp;
												dateGroup[x].setAttribute('data-date',ny+'/'+nm+'/'+parseInt(x-nweek+1));

												if(dateGroup[x].className.indexOf('date-disabled')!=-1){
													dateGroup[x].classList.remove('date-disabled');
												}

												// 判断获得真实的月份
												var _curM = new Date().getMonth()+1;
												if(_curM>12){
													if(_curM%12 == 0){
														_curM = 12;
													}else{
														_curM = _curM%12;
													}
												}

												// 设置过去日期为灰色
												if(ny == _this.curYear){
													if(nm == _curM){
														if(parseInt(x-nweek+1)<_this.curDate){
															dateGroup[x].classList.add('date-past');
														}else{
															if(dateGroup[x].className.indexOf('date-past')!=-1){
																dateGroup[x].classList.remove('date-past');
															}
														}
													}else{
														if(dateGroup[x].className.indexOf('date-past')!=-1){
															dateGroup[x].classList.remove('date-past');
														}
													}
												}else{
													if(dateGroup[x].className.indexOf('date-past')!=-1){
														dateGroup[x].classList.remove('date-past');
													}
												}

											}else{
												dateGroup[x].innerHTML ='';
												dateGroup[x].classList.add('date-disabled');
												if(dateGroup[x].getAttribute('data-date')!=''){
													dateGroup[x].removeAttribute('data-date');
												}
												if(dateGroup[x].className.indexOf('date-selected')!=-1){
													dateGroup[x].classList.remove('date-selected');
													dateGroup[x].removeAttribute('data-date');
												}
											}
										}
									}
								}
							}
						})(i)
					}
				}

				//设置选中的日期或清除选中样式
				var nSelArr =[];
				var dateAll = this.panelEls.querySelectorAll('.jm-date-box');
				if(dateAll.length>0){
					if(_this.mode == 'range'){ //多选的情况
						for(var k=0; k<dateAll.length; k++){
							(function(index){
								if(dateAll[index].className.indexOf('date-sel-start')!=-1){
									dateAll[index].classList.remove('date-sel-start');
								}
								if(dateAll[index].className.indexOf('date-sel-end')!=-1){
									dateAll[index].classList.remove('date-sel-end');
								}
								if(dateAll[index].className.indexOf('date-sel-passed')!=-1){
									dateAll[index].classList.remove('date-sel-passed');
								}

								
								if(_this.selDates.length>0 && _this.selArea.length>0){
									var arr = _this.selDates[0];
									var brr = _this.selDates[1];
									var dateStr = dateAll[index].getAttribute('data-date');
									var selLabel = dateAll[index].querySelector('.sel-label');
									
									if(dateStr == arr){ //当前日期与开始日期相同
										dateAll[index].classList.add('date-sel-start');
										if(_this.selLabels.length>0){
											selLabel.innerHTML = _this.selLabels[0];
										}
										nSelArr.push(index);
									}else if(dateStr == brr){//当前日期与结束日期相同
										dateAll[index].classList.add('date-sel-end');
										if(_this.selLabels.length>0){
											selLabel.innerHTML = _this.selLabels[1];
										}
										nSelArr.push(index);
									}else{
										if(dateAll[index].className.indexOf('date-sel-start')!=-1){
											dateAll[index].classList.remove('date-sel-start');
										}
										if(dateAll[index].className.indexOf('date-sel-end')!=-1){
											dateAll[index].classList.remove('date-sel-end');
										}
									}
								}
								
							})(k)
						}
						//设置选中区域样式
						for(var x=0; x<dateAll.length; x++){
							(function(ind){
								if(ind>nSelArr[0] && ind<nSelArr[1]){
									dateAll[ind].classList.add('date-sel-passed');
								}
							})(x)
						}
					}else{ //单选的情况
						for(var i=0; i<dateAll.length; i++){
							(function(index){
								if(dateAll[index].className.indexOf('date-selected')!=-1){
									dateAll[index].classList.remove('date-selected');
								}

								for(var s=0; s<dateAll.length; s++){
									var _d = dateAll[s].getAttribute('data-date');
									var label = dateAll[s].querySelector('.sel-label');
									if(_this.selDates.length>0){
										if(_d == _this.selDates[0]){
											dateAll[s].classList.add('date-selected');

											var fes = dateAll[s].querySelector('.fes-txt');
											if(fes!=null){
												fes.classList.add('none');
											}
											if(_this.selLabels.length>0){
												if(label!=null){
													label.innerHTML = _this.selLabels[0];
												}
											}
										}
									}
								}
							})(i)
						}
					}
				}


			}
		},
		//判断闰平年
		isLeapYear: function(year){
			if(year%4==0&&year%100!=0||year%400==0){
		        return true;
		　　}else{
				return false;
			}
		},
		//设置节日
		setFestText:function(fmonth,fdate){
			var gregorianFestivals = {
	            '0101': '元旦',
	            '0214': '情人节',
	            '0308': '妇女节',
	            '0312': '植树节',
	            '0401': '愚人节',
	            '0501': '劳动节',
	            '0504': '青年节',
	            '0512': '护士节',
	            '0601': '儿童节',
	            '0701': '建党节',
	            '0801': '建军节',
	            '0910': '教师节',
	            '1001': '国庆节',
	            '1224': '平安夜',
	            '1225': '圣诞节',
	        };
	        if(fmonth<10){
	            fmonth = '0'+fmonth;
	        }
	        if(fdate<10){
	            fdate = '0'+fdate;
	        }
	        var str = fmonth+fdate;
	        if(gregorianFestivals[str] != undefined){
            	return gregorianFestivals[str];
	        }else{
	        	return '';
	        }
		},
		//绑定事件
		bindEvent: function(){
			var _this = this;

			//上一月
			this.prevBtn.addEventListener('click',function(e){
				e.stopPropagation();
				if(_this.prevBtn.className.indexOf('jm-control-disabled') == -1){
					_this.curMonth-=1;

					if(_this.curMonth == new Date().getMonth()+1){
						_this.prevBtn.classList.add('jm-control-disabled');
					}

					if(_this.curMonth+1>new Date().getMonth()+1){
						_this.refresh();
					}
				}
			});

			//下一月
			this.nextBtn.addEventListener('click',function(e){
				e.stopPropagation();
				if(_this.nextBtn.className.indexOf('jm-control-disabled') == -1){
					_this.curMonth+=1;
					_this.refresh();
				}
				if(_this.prevBtn.className.indexOf('jm-control-disabled') !=-1){
					_this.prevBtn.classList.remove('jm-control-disabled');
				}
			});

			//日期点击
			var _selStNum; //选中开始下标
			var isSelStart = false;
			var isSelEnd = false;
			var dateBoxList = this.panelEls.querySelectorAll('.jm-date-box');
			if(dateBoxList.length>0){
				for(var i=0; i<dateBoxList.length; i++){
					(function(index){
						//鼠标点击
						dateBoxList[index].addEventListener('click',function(e){
							e.stopPropagation();
							if(_this.mode == 'single'){ //日历单选情况
								for(var j=0; j<dateBoxList.length; j++){
									if(dateBoxList[j].className.indexOf('date-selected')!=-1){
										dateBoxList[j].classList.remove('date-selected');
									}
									var fes = dateBoxList[j].querySelector('.fes-txt');
									if(fes!=null){
										if(fes.className.indexOf('none')!=-1){
											fes.classList.remove('none');
										}
									}
								}
								if(dateBoxList[index].className.indexOf('date-selected')==-1){
									if(dateBoxList[index].className.indexOf('date-past')==-1){
										if(dateBoxList[index].className.indexOf('date-disabled')==-1){
											dateBoxList[index].classList.add('date-selected');
											dateBoxList[index].querySelector('.fes-txt').classList.add('none');

											//如果存在选中的日期，数组清空
											if(_this.selDates.length>0){_this.selDates=[]};
											var _date = dateBoxList[index].getAttribute('data-date');
											_this.selDates.push(_date);

											if(_this.selLabels.length>0){
												var label = dateBoxList[index].querySelector('.sel-label');
												label.innerHTML = _this.selLabels[0];
											}
											_this.onSelection(_this.selDates);
										}
									}
								}
							}else{ //选区日历情况

								if(!isSelStart && !isSelEnd){ //去程和回程都未选

									for(var j=0; j<dateBoxList.length; j++){
										if(dateBoxList[j].className.indexOf('date-sel-start')!=-1){
											dateBoxList[j].classList.remove('date-sel-start');
											dateBoxList[j].querySelector('.sel-label').innerHTML='';
										}
										if(dateBoxList[j].className.indexOf('date-sel-end')!=-1){
											dateBoxList[j].classList.remove('date-sel-end');
											dateBoxList[j].querySelector('.sel-label').innerHTML='';
										}
										if(dateBoxList[j].className.indexOf('date-sel-passed')!=-1){
											dateBoxList[j].classList.remove('date-sel-passed');
											dateBoxList[j].querySelector('.sel-label').innerHTML='';
										}
										var fes = dateBoxList[j].querySelector('.fes-txt');
										if(fes!=null){
											if(fes.className.indexOf('none')!=-1){
												fes.classList.remove('none');
											}
										}
									}
									//选中去程加样式
									if(dateBoxList[index].className.indexOf('date-disabled')==-1){
										if(dateBoxList[index].className.indexOf('date-past')==-1){
											if(dateBoxList[index].className.indexOf('date-sel-passed')!=-1){
												dateBoxList[index].classList.remove('date-sel-passed');
											}
											dateBoxList[index].classList.add('date-sel-start');

											var fes = dateBoxList[index].querySelector('.fes-txt');
											if(fes!=null){
											    fes.classList.add('none');
											}

											//去程标签加文字
											var label = dateBoxList[index].querySelector('.sel-label');
											if(_this.selLabels.length>0){
												label.innerHTML = _this.selLabels[0];
											}
											//将去程日期加到数组
											if(_this.selDates.length==0){
												var stDate = dateBoxList[index].getAttribute('data-date');
												_this.selDates.push(stDate);
												// console.log(_this.selDates)
											}
											_selStNum = index;
											isSelStart = true;
											isSelEnd = false;
										}
									}

								}else{ 

									if(!isSelEnd){ //去程已选且回程未选

										//选中回程加样式
										if(dateBoxList[index].className.indexOf('date-disabled')==-1){
											if(dateBoxList[index].className.indexOf('date-past')==-1){
												if(index>_selStNum){
													if(dateBoxList[index].className.indexOf('date-sel-passed')!=-1){
														dateBoxList[index].classList.remove('date-sel-passed');
													}
													dateBoxList[index].classList.add('date-sel-end');

													var fes = dateBoxList[index].querySelector('.fes-txt');
													if(fes!=null){
													    fes.classList.add('none');
													}

													//回程标签加文字
													var label = dateBoxList[index].querySelector('.sel-label');
													if(_this.selLabels.length>0){
														label.innerHTML = _this.selLabels[1];
													}

													//设置选区中间日期样式
													for(var k=0; k<dateBoxList.length; k++){
														if(k<index && k>_selStNum){
															if(dateBoxList[k].className.indexOf('date-disabled')==-1){
																dateBoxList[k].classList.add('date-sel-passed');
																dateBoxList[k].querySelector('.sel-label').innerHTML='';
															}
														}
													}

													//选中的往返日期添加到数组
													if(_this.selDates.length>0){
														var stDate = dateBoxList[_selStNum].getAttribute('data-date');
														var ndDate = dateBoxList[index].getAttribute('data-date');
														_this.selDates[0] = stDate;
														_this.selDates[1] = ndDate;
														// console.log(_this.selDates)
													}
													//选中的往返日期下标加到选区数组
													_this.selArea.push(_selStNum,index);

												}else{ //判断下标大小并互换类名
													dateBoxList[index].classList.add('date-sel-start');
													dateBoxList[_selStNum].classList.add('date-sel-end');

													if(dateBoxList[index].className.indexOf('date-sel-passed')!=-1){
														dateBoxList[index].classList.remove('date-sel-passed');
													}

													var fes = dateBoxList[index].querySelector('.fes-txt');
													if(fes!=null){
													    fes.classList.add('none');
													}

													//去程标签加文字
													var label = dateBoxList[index].querySelector('.sel-label');
													var label2 = dateBoxList[_selStNum].querySelector('.sel-label');
													if(_this.selLabels.length>0){
														label.innerHTML = _this.selLabels[0];
														label2.innerHTML = _this.selLabels[1];
													}

													//设置选区中间日期样式
													for(var k=0; k<dateBoxList.length; k++){
														if(k<_selStNum && k>index){
															if(dateBoxList[k].className.indexOf('date-disabled')==-1){
																dateBoxList[k].classList.add('date-sel-passed');
															}
														}
													}

													//选中的往返日期添加到数组
													if(_this.selDates.length>0){
														var stDate = dateBoxList[index].getAttribute('data-date');
														var ndDate = dateBoxList[_selStNum].getAttribute('data-date');
														_this.selDates[0] = stDate;
														_this.selDates[1] = ndDate;
														// console.log(_this.selDates)
													}
													//选中的往返日期下标加到选区数组
													_this.selArea.push(index,_selStNum);

												}
												// console.log(index, _selStNum)
												// console.log(_this)
												isSelStart = true;
												isSelEnd = true;
												_this.onSelection(_this.selDates);
											}
										}

									}else{ //去程和回程都已选

										for(var j=0; j<dateBoxList.length; j++){
											if(dateBoxList[j].className.indexOf('date-sel-start')!=-1){
												dateBoxList[j].classList.remove('date-sel-start');
												dateBoxList[j].querySelector('.sel-label').innerHTML='';
											}
											if(dateBoxList[j].className.indexOf('date-sel-end')!=-1){
												dateBoxList[j].classList.remove('date-sel-end');
												dateBoxList[j].querySelector('.sel-label').innerHTML='';
											}
											if(dateBoxList[j].className.indexOf('date-sel-passed')!=-1){
												dateBoxList[j].classList.remove('date-sel-passed');
												dateBoxList[j].querySelector('.sel-label').innerHTML='';
											}
											var fes = dateBoxList[j].querySelector('.fes-txt');
											if(fes!=null){
												if(fes.className.indexOf('none')!=-1){
													fes.classList.remove('none');
												}
											}
										}
										//选中去程加样式
										if(dateBoxList[index].className.indexOf('date-disabled')==-1){
											if(dateBoxList[index].className.indexOf('date-past')==-1){
												dateBoxList[index].classList.add('date-sel-start');

												var fes = dateBoxList[index].querySelector('.fes-txt');
												if(fes!=null){
												    fes.classList.add('none');
												}

												//去程标签加文字
												var label = dateBoxList[index].querySelector('.sel-label');
												if(_this.selLabels.length>0){
													label.innerHTML = _this.selLabels[0];
												}
												//将去程日期加到数组
												if(_this.selDates.length>0){
													_this.selDates =[];
													var stDate = dateBoxList[index].getAttribute('data-date');
													_this.selDates.push(stDate);
												}
												_selStNum = index;
												isSelStart = true;
												isSelEnd = false;
											}
										}
									}
								}
							}
						});
						
						//鼠标经过
						dateBoxList[index].addEventListener('mouseover', function(){
							if(_this.mode == 'range'){
								if(_this.selDates.length == 1){
									if(dateBoxList[index].className.indexOf('date-disabled')!=-1){
										return false;
									}
									if(dateBoxList[index].className.indexOf('date-past')!=-1){
										return false;
									}
									if(dateBoxList[index].className.indexOf('date-sel-start')!=-1){
										return false;
									}
									if(dateBoxList[index].className.indexOf('date-sel-end')!=-1){
										dateBoxList[index].classList.remove('date-sel-passed');
										return false;
									}
									
									//开始日期与经过日期
									var d1 = new Date(_this.selDates[0]).getTime();
									var d2 = new Date(dateBoxList[index].getAttribute('data-date')).getTime();

									var overlist = _this.panelEls.querySelectorAll('.jm-date-box');
									for(var z=0; z<overlist.length; z++){
										(function(ind){
											if(d1<d2){ //开始日期小于经过日期
												var d3 = new Date(overlist[ind].getAttribute('data-date')).getTime();
												if(d3>d1 && d3<d2 || d3 == d2){
													for(var k=0; k<overlist.length; k++){
														var _d4 = new Date(overlist[k].getAttribute('data-date')).getTime();
														if(_d4<d1){
															if(overlist[k].className.indexOf('date-sel-passed')!=-1){
																overlist[k].classList.remove('date-sel-passed');
															}
														}
														if(_d4>d2){
															if(overlist[k].className.indexOf('date-sel-passed')!=-1){
																overlist[k].classList.remove('date-sel-passed');
															}
														}
													}
													if(overlist[ind].className.indexOf('date-sel-end') == -1){
														overlist[ind].classList.add('date-sel-passed');
													}else{
														return false;
													}
												}
											}else{
												var d3 = new Date(overlist[ind].getAttribute('data-date')).getTime();
												if(d3>d2 && d3<d1 || d3 == d2){
													for(var k=0; k<overlist.length; k++){
														var _d4 = new Date(overlist[k].getAttribute('data-date')).getTime();
														if(_d4>d1){
															if(overlist[k].className.indexOf('date-sel-passed')!=-1){
																overlist[k].classList.remove('date-sel-passed');
															}
														}
														if(_d4<d2){
															if(overlist[k].className.indexOf('date-sel-passed')!=-1){
																overlist[k].classList.remove('date-sel-passed');
															}
														}
													}
													if(overlist[ind].className.indexOf('date-sel-end') == -1){
														overlist[ind].classList.add('date-sel-passed');
													}else{
														return false;
													}
													if(overlist[ind].className.indexOf('date-sel-start') == -1){
														overlist[ind].classList.add('date-sel-passed');
													}else{
														return false;
													}
												}
											}

										})(z)
									}
									
								}
							}
						});

					})(i)
				}
			}
		},
		//选中的回调函数
		onSelection: function(arr){
			var _this = this;
			if(_this.selectionType === 'callback'){
				_this.onSelection.call(_this);
			}else{
				_this.hide();
			}
		},
		//隐藏弹层
		hide: function (){
			var _this = this;
			_this.rootTmp.classList.add('jm-datepicker-hide');
		},
		//隐藏显示
		show: function(){
			var _this = this;
			if(_this.rootTmp.className.indexOf('jm-datepicker-hide')!=-1){
				_this.rootTmp.classList.remove('jm-datepicker-hide');
			}
		},
	}
	return datePicker;
})()