chrome.runtime.onInstalled.addListener(function() {
	chrome.storage.sync.get(['target_domains'], function(storage){

		if(!storage.target_domains){
    		chrome.storage.sync.set({
    			target_domains : [],
    			spent_time: 0,
    			time_limit: 20*60
    		});
		}
	});
	
	check_visible_tab();
});

chrome.runtime.onStartup.addListener( () => check_visible_tab() );

function updateTime(seconds) {
	var date = new Date(null);
	date.setSeconds(seconds);
	var timeString = date.toISOString().substr(11, 8);
	return timeString;
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function isNewDay(){
	currentDate = new Date();
	var objDate = [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()];
	chrome.storage.sync.get(['last_date'], function(storage){
		if(!arraysEqual( objDate, storage.last_date)){
			chrome.storage.sync.set({last_date : objDate, spent_time : 0});
		}
	});
}

function check_visible_tab(){
	timer = setInterval(function(){
		chrome.windows.getLastFocused({populate: true}, function(top_window){
			chrome.tabs.query({ 'active' : true, 'windowId' : top_window.id}, function(check_tab_array){
				chrome.storage.sync.get(['target_domains', 'spent_time', 'time_limit'], function (result) {

					var regexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/;
					var domain = check_tab_array[0].url.match(regexp)[1];
					
					if(result.target_domains.includes(domain) && top_window.focused){

						//update spent time
						chrome.storage.sync.set({ spent_time: ++result.spent_time });
						
						if(result.spent_time % 60 == 0){
							//update badge
							chrome.browserAction.setBadgeText({ 'text': updateTime(result.spent_time).slice(0,5) });

							//if new day - set time to zero
							isNewDay();
						}

						//check limit
						if(result.spent_time  >= result.time_limit){
							if(confirm('Stop wasting time! Close this page?'))
								chrome.tabs.remove(check_tab_array[0].id);
						}
					}
				});
			});
		});
	}, 1000);
}