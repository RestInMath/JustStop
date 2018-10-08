'use strict';

const new_domain_name = 'Choose domain';

function unfoldContent() {
	let content = this.nextElementSibling;
	if(content.style.maxHeight){
		this.style.color = '';
		content.classList.remove('lineBorder');

		content.style.maxHeight = null;
	} else {
		this.style.color = 'black';
		content.classList.add('lineBorder');

		content.style.maxHeight = content.scrollHeight + 'px';
	}
}

function blinkRed(element) {
	element.style.color = 'red';
	setTimeout(() => element.style.color = 'black', 2500);
}

function syncTimeLimit() {
	var newTimeLimit = this.parentElement.getElementsByTagName('input')[0].value;

	unfoldContent.call(document.getElementById('spentTime'));

	chrome.storage.sync.set({time_limit : newTimeLimit * 60});
}

function removeDomainFromStorage(domainLabel){
	chrome.storage.sync.get(['target_domains'], function(storage){
		var domainList = storage.target_domains;

		let index = domainList.indexOf(domainLabel.textContent);
		domainList.splice(index, 1);

		chrome.storage.sync.set({target_domains: domainList});
	});
}

function syncDomain() {
	var domainName = this.parentElement.getElementsByTagName('input')[0].value;
	var domainLabel = this.parentElement.previousSibling;

	if(domainName == '')
		return;

	//change domain list
	chrome.storage.sync.get(['target_domains'], function(storage){
		var domainList = storage.target_domains;
		
		//changed existing domain
		if(domainLabel.textContent != new_domain_name){
			let index = domainList.indexOf(domainLabel.textContent);
			domainList.splice(index, 1);
		}

		//created new domain
		if(!domainList.includes(domainName)){
			domainList.push(domainName);

			chrome.storage.sync.set({target_domains : domainList});
			domainLabel.textContent = domainName;
			
			unfoldContent.call(domainLabel);
		}
		else{
			//domain name is already in list, show it
			var domains = document.getElementsByClassName('collapsible');
			for(let i = 0; i < domains.length; i++){
				if(domains[i].textContent == domainName){
					blinkRed(domains[i]);
				}
			}
		}
	});
}

function createNewDomainOption(option){
	var input = document.createElement('input');
	input.type = 'text';
	input.placeholder = 'Domain name';

	var okButton = document.createElement('button');
	okButton.innerHTML = 'OK';
	okButton.className = 'optionButton';

	option.appendChild(input);
	option.appendChild(okButton);
	
	input.addEventListener('change', syncDomain);
	okButton.addEventListener('click', syncDomain);
}

function removeDomainLabel(){
	var domainOption = this.parentElement;
	var domainLabel = domainOption.previousSibling;
	
	removeDomainFromStorage(domainLabel);

	domainLabel.parentElement.removeChild(domainOption);
	domainLabel.parentElement.removeChild(domainLabel);
}

function createExistingDomainOption(option){
	var deleteBut = document.createElement('button');
	deleteBut.innerHTML = 'Delete';
	deleteBut.className = 'optionButton';

	option.appendChild(deleteBut);
	deleteBut.addEventListener('click', removeDomainLabel);
}

function createDomainOption(domain_name){
	var plusButton = document.getElementById('plusButton');

	var div = document.createElement('div');
	div.className = 'collapsible';
	div.appendChild(document.createTextNode(domain_name));

	var option = document.createElement('div');
	option.className = 'options';

	document.body.insertBefore(div, plusButton);
	document.body.insertBefore(option, plusButton);

	//make collapsible
	div.addEventListener('click', unfoldContent);
	
	if(domain_name == new_domain_name){
		createNewDomainOption(option);
		unfoldContent.call(div);
	}
	else{
		createExistingDomainOption(option);
	}
}

function drawElements(storage){
	drawPlusButton();

	//update timer
	var timerDiv = document.getElementById('spentTime');
	timerDiv.innerHTML = updateTime(storage.spent_time);
	timerDiv.addEventListener('click', unfoldContent);

	//show current time limit
	document.getElementById('timeLimitDiv').appendChild(document.createTextNode(updateTime(storage.time_limit)));

	document.getElementById('timeLimitOkButton').addEventListener('click', syncTimeLimit);

	for(let i = 0; i < storage.target_domains.length; i++){
		createDomainOption(storage.target_domains[i]);
	}
}

function drawPlusButton(){
	var addButton = document.createElement('div');
	addButton.innerHTML = '&#10010';
	addButton.id = 'plusButton';
	document.body.appendChild(addButton);

	addButton.addEventListener('click',  () => createDomainOption(new_domain_name));
}

document.addEventListener('DOMContentLoaded', () => {

	chrome.storage.sync.get(['target_domains','spent_time', 'time_limit'], storage => drawElements(storage));
});