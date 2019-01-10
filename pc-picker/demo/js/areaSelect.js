(function() {
    // 事件兼容
    var Event = {};
        Event.addEvents = function(target,eventType,handle){
            if(document.addEventListener){
                Event.addEvents = function(target,eventType,handle){
                        target.addEventListener(eventType,handle,false);
            };
            }else {
                Event.addEvents = function(target,eventType,handle){
                    target.attachEvent('on'+eventType,function(){
                        handle.call(target,arguments);
                    });
                };
            }
        Event.addEvents(target,eventType,handle);
	}
	if (!Array.prototype.some){
		Array.prototype.some = function(fun /*, thisArg */)  {
		  'use strict';
		  if (this === void 0 || this === null)
			throw new TypeError();
		  var t = Object(this);
		  var len = t.length >>> 0;
		  if (typeof fun !== 'function')
			throw new TypeError();
		  var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
		  for (var i = 0; i < len; i++)
		  {
			if (i in t && fun.call(thisArg, t[i], i, t))
			  return true;
		  }
		  return false;
		};
	  }
	  if (!Array.prototype.indexOf){
			Array.prototype.indexOf = function(elt /*, from*/){
			var len = this.length >>> 0;
			var from = Number(arguments[1]) || 0;
			from = (from < 0)
				? Math.ceil(from)
				: Math.floor(from);
			if (from < 0)
			from += len;
			for (; from < len; from++)
			{
			if (from in this &&
				this[from] === elt)
				return from;
			}
			return -1;
		};
		}

	  if (!Function.prototype.bind) { 
			Function.prototype.bind = function (oThis) { 
				if (typeof this !== "function") { 		
					throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable"); 
				} 
				var aArgs = Array.prototype.slice.call(arguments, 1), 
				fToBind = this, 
				fNOP = function () {}, 
				fBound = function () { 
					return fToBind.apply(this instanceof fNOP && oThis 
					? this 
					: oThis, 
					aArgs.concat(Array.prototype.slice.call(arguments))); 
				}; 
				fNOP.prototype = this.prototype; 
				fBound.prototype = new fNOP(); 
				return fBound; 
			}; 
		}
		if ( !Array.prototype.forEach ) {
			Array.prototype.forEach = function forEach( callback, thisArg ) {
				var T, k;
				if ( this == null ) {
					throw new TypeError( "this is null or not defined" );
				}
				var O = Object(this);
				var len = O.length >>> 0;
				if ( typeof callback !== "function" ) {
					throw new TypeError( callback + " is not a function" );
				}
				if ( arguments.length > 1 ) {
					T = thisArg;
				}
				k = 0;
				while( k < len ) {
					var kValue;
					if ( k in O ) {
						kValue = O[ k ];
						callback.call( T, kValue, k, O );
					}
					k++;
				}
			};
		}
		if (!("classList" in document.documentElement)) {
			window.HTMLElement = window.HTMLElement || Element;
			Object.defineProperty(HTMLElement.prototype, 'classList', {
				get: function() {
					var self = this;
					function update(fn) {
						return function(value) {
							var classes = self.className.split(/\s+/g),
								index = classes.indexOf(value);
							fn(classes, index, value);
							self.className = classes.join(" ");
						}
					}		
					return {
						add: update(function(classes, index, value) {
							if (!~index) classes.push(value);
						}),
						remove: update(function(classes, index) {
							if (~index) classes.splice(index, 1);
						}),
						toggle: update(function(classes, index, value) {
							if (~index)
								classes.splice(index, 1);
							else
								classes.push(value);
						}),
						contains: function(value) {
							return !!~self.className.split(/\s+/g).indexOf(value);
						},
						item: function(i) {
							return self.className.split(/\s+/g)[i] || null;
						}
					};
				}
			});
		}

		function addEvent(element, eType, handle, bol) {
			if(element.addEventListener){           //如果支持addEventListener
				element.addEventListener(eType, handle, bol);
			}else if(element.attachEvent){          //如果支持attachEvent
				element.attachEvent("on"+eType, handle);
			}else{                                  //否则使用兼容的onclick绑定
				element["on"+eType] = handle;
			}
		}


    var selectUtil = {
		isArray: function(arg1) {
			return Object.prototype.toString.call(arg1) === '[object Array]';
		},
		isFunction: function(arg1) {
			return typeof arg1 === 'function';
		},
		getDataset:function(ele){
			if(ele.dataset){
				return ele.dataset;
			}else{
				var attrs = ele.attributes,//元素的属性集合
					dataset = {},
					name,
					matchStr;
				for(var i = 0;i<attrs.length;i++){
					//是否是data- 开头
					matchStr = attrs[i].name.match(/^data-(.+)/);
					if(matchStr){
						//data-auto-play 转成驼峰写法 autoPlay
						name = matchStr[1].replace(/-([\da-z])/gi,function(all,letter){
							return letter.toUpperCase();
						});
						dataset[name] = attrs[i].value;
					}
				}
				return dataset;
			}
		},
        attrToData: function(dom, index) {
			var obj = {};
			for (var p in this.getDataset(dom)) {
				obj[p] = this.getDataset(dom)[p];
			}
			obj['dom'] = dom;
			obj['atindex'] = index;
			return obj;
		},
		attrToHtml: function(obj) {
			var html = '';
			for (var p in obj) {
				html += 'data-' + p + '="' + obj[p] + '"';
			}
			return html;
		}
    };

    function AreaSelect(level, data, options) {
		if (!selectUtil.isArray(data) || data.length === 0) {
			return;
		}
        this.data = data;
        this.document = document;
		this.level = level || 1;
		this.options = options;
		this.callback = options.callback;
		this.options.wrapper = this.options.wrapper;
		this.theme = this.options.theme || 'green'; 
		this.isScroll = this.options.isScroll;
        if(typeof this.options.wrapper === undefined){
            throw new Error('缺少对象');
		}
		if(this.level <= 1){
			throw new Error('城市选择，最少2级');
		}
		
		this.init();
    };


    AreaSelect.prototype = {

		init: function() {
            this.initUlDom();
			// 选中元素的信息
			this.selectOneObj = {};
			this.selectTwoObj = {};
            this.selectThreeObj = {};
            this.oneLevelUlContainDom = this.document.querySelector("#province-list");
            this.twoLevelUlContainDom = this.document.querySelector("#city-list");
			this.threeLevelUlContainDom = this.document.querySelector("#district-list");			
            this.initSelect();
			this.setOneLevel(this.options.oneLevelId, this.options.twoLevelId, this.options.threeLevelId);			
            this.callback && this.callback(this.selectOneObj, this.selectTwoObj, this.selectThreeObj);           
		},
		
        initUlDom:function(){
            var wrapper = this.document.querySelector(this.options.wrapper);
            var all_html = '';
            if(this.level === 2){
                all_html = '<ul class="area-list" id="province-list" ></ul>\
                <ul class="area-list" id="city-list" ></ul>';
            }else{
                all_html = '<ul class="area-list" id="province-list" ></ul>\
                <ul class="area-list" id="city-list" ></ul>\
                <ul class="area-list" id="district-list"></ul>';
            }
			wrapper.innerHTML = all_html;
		},
		
        initSelect:function(){
			var self = this;
            addEvent(this.oneLevelUlContainDom,'click',function(e){
				var event = e || window.event;
				var target = event.target || event.srcElement;
                if(target.nodeName === 'LI'){
					var plast = 0;
					var dataSetObj = selectUtil.getDataset(target);
					var id = dataSetObj.id; 
                    plast = self.clickChangeClass(self.oneLevelUlContainDom,id)
                    var pdom = self.changeClassName(self.oneLevelUlContainDom, plast);
                    self.selectOneObj = selectUtil.attrToData(pdom, plast);
                    self.setTwoLevel(self.selectOneObj.id, self.selectTwoObj.id, self.selectThreeObj.id);
                    self.callback && self.callback(self.selectOneObj, self.selectTwoObj, self.selectThreeObj);
                }
     
            })

            addEvent(this.twoLevelUlContainDom,'click',function(e){
				var event = e || window.event;
				var target = event.target || event.srcElement;
                if(target.nodeName === 'LI'){
                    var plast = 0;
                    var dataSetObj = selectUtil.getDataset(target);
					var id = dataSetObj.id;
                    plast = self.clickChangeClass(self.twoLevelUlContainDom,id)
                    var pdom = self.changeClassName(self.twoLevelUlContainDom, plast);
                    self.selectTwoObj = selectUtil.attrToData(pdom, plast);
                    if (self.level == 3 ) {
                        self.setThreeLevel(self.selectOneObj.id, self.selectTwoObj.id, self.selectThreeObj.id);
					}
                    self.callback && self.callback(self.selectOneObj, self.selectTwoObj, self.selectThreeObj);
                }
            })
            if(self.level === 3){
                addEvent(this.threeLevelUlContainDom,'click',function(e){
					var event = e || window.event;
				    var target = event.target || event.srcElement;
                    if(target.nodeName === 'LI'){
                        var plast = 0;
						var dataSetObj = selectUtil.getDataset(target);
						var id = dataSetObj.id;
                        plast = self.clickChangeClass(self.threeLevelUlContainDom,id)
                        var pdom = self.changeClassName(self.threeLevelUlContainDom, plast);
                        self.selectThreeObj = selectUtil.attrToData(pdom, plast);
                        self.callback && self.callback(self.selectOneObj, self.selectTwoObj, self.selectThreeObj);
                    }
                })
			}
			
        },

        clickChangeClass:function(levelContainDom,id){
			var plast = 0;
			// 解决ie8下slice报错的问题
			Array.prototype.concat.apply([],levelContainDom.querySelectorAll('li')).forEach(function(v, i, o) {
				if(selectUtil.getDataset(v).id === id){
					plast = i
				}
				if (v.classList.contains('active')) {
					v.classList.remove('active');
				} 
			});
            return plast;
            
		},
		
        changeClassName: function(levelContainDom, plast) {
			var pdom;
			var list = levelContainDom.querySelectorAll('li');
			pdom = list[plast];
			pdom.classList.add('active');
	    	return pdom;
		},
		
        getOneLevel: function() {
			return this.data[0];
		},

		setOneLevel: function(oneLevelId, twoLevelId, threeLevelId, fourLevelId, fiveLevelId) {
			if (selectUtil.isArray(this.data[0])){
				var oneLevelData = this.getOneLevel();
				this.renderOneLevel(oneLevelId, twoLevelId, threeLevelId,oneLevelData);
			}
			else {
				throw new Error('data format error');
			}
        },
        renderOneLevel: function(oneLevelId, twoLevelId, threeLevelId, oneLevelData) {
			var hasAtId = oneLevelData.some(function(v, i, o) {
				return v.id == oneLevelId;
			});
			if (!hasAtId) {
				oneLevelId = oneLevelData[0]['id'];
			}
			var oneHtml = '';
			var self = this;
			var plast = 0;
			oneLevelData.forEach(function(v, i, o) {
				if (v.id == oneLevelId) {
					oneHtml += '<li class="list_item area-list-item-'+self.theme+' active" '+selectUtil.attrToHtml(v)+'>'+v.value+'</li>';
					plast = i;
				} else {
					oneHtml += '<li class="list_item area-list-item-'+self.theme+' " '+selectUtil.attrToHtml(v)+'>'+v.value+'</li>';
				}
            }.bind(this));
           
			this.oneLevelUlContainDom.innerHTML = oneHtml;
			if(this.isScroll){
				$("#province-list").mCustomScrollbar();
			}
			if (this.level >= 2) {
				this.setTwoLevel(oneLevelId, twoLevelId, threeLevelId);
            }
            var pdom = this.changeClassName(this.oneLevelUlContainDom, plast);
            
            this.selectOneObj = selectUtil.attrToData(pdom, plast);
            
        },
        setTwoLevel: function(oneLevelId, twoLevelId, threeLevelId) {
			if (selectUtil.isArray(this.data[1])) {
				var twoLevelData = this.getTwoLevel(oneLevelId);
				this.renderTwoLevel(oneLevelId, twoLevelId, threeLevelId, twoLevelData);
			}else {
				throw new Error('data format error');
			}
        },
        getTwoLevel: function(oneLevelId) {
			var twoLevelData = [];		
			this.data[1].forEach(function(v, i, o) {
				if (v['parentId'] === oneLevelId) {
					twoLevelData.push(v);
				}
			});
			return twoLevelData;
        },
        renderTwoLevel: function(oneLevelId, twoLevelId, threeLevelId, twoLevelData) {
			var plast = 0;
			var hasAtId = twoLevelData.some(function(v, i, o) {
				return v.id == twoLevelId;
			});
			if (!hasAtId) {
				twoLevelId = twoLevelData[0]['id'];
			}
			var twoHtml = '';
			var self = this;
			twoLevelData.forEach(function(v, i, o) {
				if (v.id == twoLevelId) {
					twoHtml += '<li class="list_item area-list-item-'+self.theme+' active" '+selectUtil.attrToHtml(v)+'>'+v.value+'</li>';
				} else {
					twoHtml += '<li class="list_item area-list-item-'+self.theme+'" '+selectUtil.attrToHtml(v)+'>'+v.value+'</li>';
				}
			}.bind(this));
			this.twoLevelUlContainDom.innerHTML = twoHtml;
			if(this.isScroll){
				$("#city-list").mCustomScrollbar();
			}

			if (this.level >= 3) {
				this.setThreeLevel(oneLevelId, twoLevelId, threeLevelId);
			}
			var pdom = this.changeClassName(this.twoLevelUlContainDom, plast);
            
            this.selectTwoObj = selectUtil.attrToData(pdom, plast);
        },
        getThreeLevel: function(oneLevelId, twoLevelId) {
			var threeLevelData = [];
			this.data[2].forEach(function(v, i, o) {
				if (v['parentId'] === twoLevelId) {
					threeLevelData.push(v);
				}
			});
			return threeLevelData;
		},
        setThreeLevel: function(oneLevelId, twoLevelId, threeLevelId) {
			if (selectUtil.isArray(this.data[2])) {
				var threeLevelData = this.getThreeLevel(oneLevelId, twoLevelId);
				this.renderThreeLevel(oneLevelId, twoLevelId, threeLevelId,  threeLevelData);
			}
			else if (selectUtil.isFunction(this.data[2])) {
				this.loadingShow();
				this.data[2](oneLevelId, twoLevelId, function(threeLevelData) {
					this.loadingHide();
					this.renderThreeLevel(oneLevelId, twoLevelId, threeLevelId, threeLevelData);
				}.bind(this));
			}
			else {
				throw new Error('data format error');
			}
        },
        renderThreeLevel: function(oneLevelId, twoLevelId, threeLevelId, threeLevelData) {
	    	var plast = 0;
			var hasAtId = threeLevelData.some(function(v, i, o) {
				return v.id == threeLevelId;
			});
			if (!hasAtId) {
				threeLevelId = threeLevelData[0]['id'];
			}
			var threeHtml = '';
			var self = this;
			threeLevelData.forEach(function(v, i, o) {
				if (v.id == threeLevelId) {
					threeHtml += '<li class="list_item area-list-item-'+ self.theme+' active" '+selectUtil.attrToHtml(v)+'>'+v.value+'</li>';
				} else {
					threeHtml += '<li class="list_item area-list-item-'+self.theme+'" '+selectUtil.attrToHtml(v)+'>'+v.value+'</li>';
				}
			}.bind(this));
			this.threeLevelUlContainDom.innerHTML = threeHtml;
			if(this.isScroll){
				$("#district-list").mCustomScrollbar();
			}
            var pdom = this.changeClassName(this.threeLevelUlContainDom, plast);
            
            this.selectThreeObj = selectUtil.attrToData(pdom, plast);
			
	    },
       
	}
    if (typeof module != 'undefined' && module.exports) {
		module.exports = AreaSelect;
	} else if (typeof define == 'function' && define.amd) {
		define(function() {
			return AreaSelect;
		});
	} else {
		window.AreaSelect = AreaSelect;
	}

})();
