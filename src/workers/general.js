function mapWorker(fun,callback,onerr){
	if(typeof Worker === 'undefined'){
		return fakeMapWorker(fun,callback,onerr);
	}
	var w = new Communist();
	var worker = makeWorker($$fObj$$);
	worker.onmessage = function(e){
		callback(e.data);
	};
	if(onerr){
		worker.onerror=onerr;
	}else{
		worker.onerror=function(){callback();};
	}
	w.data=function(data,transfer){
		!c._noTransferable?worker.postMessage(data,transfer):worker.postMessage(data);
		return w;
	};
	w.close=function(){
		return worker.terminate();
	};
	return w;
}