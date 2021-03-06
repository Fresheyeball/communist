function fakeObject(inObj){
	/*jslint evil: true */
	var w = new Communist();
	var promises = [];
	var loaded = false;
	var wlisteners = {};
	var olisteners={};
	var loading;
	function ajax(url){
		var promise = c.deferred();
		var xhr = new XMLHttpRequest();
		xhr.open('GET',url);
		xhr.onload = function() {
			promise.resolve(xhr.responseText);
		};
		xhr.onerror=function(){
			promise.reject('failed to download');
		};
		xhr.send();
		return promise.promise;
	}
	var rejectPromises = function(msg){
		if(typeof msg!=="string" && msg.preventDefault){
			msg.preventDefault();
			msg=msg.message;
		}
		promises.forEach(function(p){
			if(p){
				p.reject(msg);
			}
		});
	};
	var obj;
	if(!("initialize" in inObj)){
		if('init' in inObj){
			inObj.initialize=inObj.init;
		}else{
			inObj.initialize=function(){};
		}
	}
	var keyFunc=function(key){
		var actualFunc = function(data){
			var result,i,callback;
			i = promises.length;
			promises[i] = c.deferred();
			callback = function(data){
				promises[i].resolve(data);
			};
			try{
				result = obj[key].call(obj,data,callback);
				if(typeof result !== "undefined"){
					callback(result);
				}
			} catch (e){
				promises[i].reject({preventDefault:function(){},messege:e});
			}
			return promises[i].promise;
		};
		return function(data){
			if(loaded){
				return actualFunc(data);
			}else{
				return loading.then(function(){
					return actualFunc(data);
				});
			}
		};
	};
	var i = 0;
	var fObj="{";
	for(var key in inObj){
		if(i!==0){
			fObj=fObj+",";
		}else{
			i++;
		}
		fObj=fObj+key+":"+inObj[key].toString();
		w[key]=keyFunc(key);
	}
	fObj=fObj+"}";
	var re = /(\S+?:function\s*?)(\S+?)(\s*?\()/g;
	var regexed = regexImports(fObj);
	var forImport = regexed[0];
	if(forImport.length === 0){
		loaded = true;
		(function(){
			eval('obj = '+regexed[1].replace(re,'$1$3'));
		})();
		addEvents(w,obj);
	}else{
		loading = c.all(forImport.map(function(v){
			return ajax(v);
		})).then(function(array){
			eval(array.join("\n")+";\nobj = "+regexed[1].replace(re,'$1$3'));
			addEvents(w,obj);
			return true;
		});
	}
	function addEvents(w,obj){
	w.on=function(eventName,func,scope){
		scope = scope || w;
		if(eventName.indexOf(' ')>0){
			eventName.split(' ').map(function(v){
				return w.on(v,func,scope);
			},this);
			return w;
		}
		if(!(eventName in wlisteners)){
			wlisteners[eventName]=[];
		}
		wlisteners[eventName].push(function(a){
			func.call(scope,a);
		});
	};
	w.fire=function(eventName,data){
		if(!(eventName in olisteners)){
			return w;
		}
		olisteners[eventName].forEach(function(v){
			v(data);
		});
		return w;
	};
	w.off = function (eventName, func) {
		if(eventName.indexOf(' ')>0){
			eventName.split(' ').map(function(v){
				return w.off(v,func);
			});
			return w;
		}
		if (!(eventName in wlisteners)) {
			return w;
		}
		else if (!func) {
			delete wlisteners[eventName];
		}
		else {
			if (wlisteners[eventName].indexOf(func) > -1) {
				if (wlisteners[eventName].length > 1) {
					delete wlisteners[eventName];
				}
				else {
					wlisteners[eventName].splice(wlisteners[eventName].indexOf(func), 1);
				}
			}
		}
		return w;
	};
	obj.on=function(eventName,func,scope){
		scope = scope || obj;
		if(eventName.indexOf(' ')>0){
			eventName.split(' ').map(function(v){
				return obj.on(v,func,scope);
			},this);
			return obj;
		}
		if(!(eventName in olisteners)){
			olisteners[eventName]=[];
		}
		olisteners[eventName].push(function(a){
			func.call(scope,a);
		});
		return obj;
	};
	obj.fire=function(eventName,data){
		if(!(eventName in wlisteners)){
			return obj;
		}
		wlisteners[eventName].forEach(function(v){
			v(data);
		});
		return obj;
	};
	obj.off = function (eventName, func) {
		if(eventName.indexOf(' ')>0){
			eventName.split(' ').map(function(v){
				return obj.off(v,func);
			});
			return obj;
		}
		if (!(eventName in olisteners)) {
			return obj;
		}
		else if (!func) {
			delete olisteners[eventName];
		}
		else {
			if (olisteners[eventName].indexOf(func) > -1) {
				if (olisteners[eventName].length > 1) {
					delete olisteners[eventName];
				}
				else {
					olisteners[eventName].splice(olisteners[eventName].indexOf(func), 1);
				}
			}
		}
		return obj;
	};
	}
	w._close = function(){
		olisteners={};
		wlisteners={};
		promises.forEach(function(a){
			a.reject("closed");
		});
		return c.resolve();
	};
	if(!('close' in w)){
		w.close=w._close;
	}
	w.initialize();
	return w;
}

function fakeMapWorker(fun,callback,onerr){
	var w = new Communist();
	var worker = fakeObject({data:fun});
	w.data=function(data){
		worker.data(data).then(callback,onerr);
		return w;
	};
	w.close=worker.close;
	return w;
}

function fakeReducer(fun,callback){
	var w = new Communist();
	var accum;
	w.data=function(data){
		accum=accum?fun(accum,data):data;
		return w;
	};
	w.fetch=function(){
		callback(accum);
		return w;
	};
	w.close=function(silent){
		if(!silent){
			callback(accum);
		}
		return;
	};
	return w;
}
