;(function(){

	var geo = document.getElementById('geo'),
		config = JSON.parse(geo.textContent),
		expiry = config.expiry,
		storageSupported = typeof localStorage !== 'undefined' || typeof sessionStorage !== 'undefined',
		storageEngine = window.localStorage || window.sessionStorage,
		DEBUG = config.debug || false;

	if (storageSupported) {
		// Really supported?
		try {
			storageEngine.setItem('geo-support-testing', 1);
		} catch(e) {
			storageSupported = false;
		} finally {
			storageEngine.removeItem('geo-support-testing');
		}
	}	

	if (DEBUG) console.info('GEO - Native browser storage supported? %s', storageSupported);

	if (!!storageSupported === false) {
		storageEngine = {
			data : {},
			getItem : function(key){
				if (this.data.hasOwnProperty(key)) return this.data[key];
				else return null;
			},
			setItem : function(key, value){
				this.data[key] = value;
			},
			removeItem : function(key){
				this.data.delete(key);
			}
		}
	}

	window.onlocaleupdate = function(){
		
		var d = storageEngine.getItem('localeD'),
			cc = storageEngine.getItem('localeCC'),
			s = storageEngine.getItem('localeS');			

		var locale = '';
		if (config.district_code.indexOf(parseInt(d, 10)) !== -1) locale = d;
		else if (!!cc && config.country_code.indexOf(cc.toLowerCase() !== -1) && cc !== 'HK') locale = cc;

		if ('$' in window) {			
			$.ajaxSetup({
				headers : {
					'X-US-Region' : locale
				}
			});			
		} else {
			if (DEBUG) console.warn('jQuery not loaded, ajax setup will be skipped. This is not an error.');
		}

		createStyle(d, cc, s);
	}

	function createStyle(d, cc, s){
		
		var styles = [], cname = [],
			html = document.querySelector('html'),
			style = document.querySelector('#geo-style') || document.createElement('style');

		style.id = "geo-style";
		config.country_code.forEach(function(cc){
			var find = new RegExp('_CC_', 'g'),
				out = 'html:not(.country-_CC_) .visible-country-_CC_ { display: none!important }'.replace(find, cc);
			styles.push(out);
		});
		config.state_code.forEach(function(s){
			var find = new RegExp('_S_', 'g'),
				out = 'html:not(.state-_S_) .visible-state-_S_ { display: none!important }'.replace(find, s);
			styles.push(out);
		});
		config.district_code.forEach(function(d){
			var find = new RegExp('_D_', 'g'),
				out = 'html:not(.district-_D_) .visible-district-_D_ { display: none!important }'.replace(find, d);
			styles.push(out);
		});

		style.innerHTML = styles.join('\r\n');
		geo.parentNode.insertBefore(style, geo);

		[].forEach.call(html.classList, function(name){
			if (!/^(state|district|country)-/.test(name)) cname.push(name);
		});
				

		if (!!s) cname.push('state-' + s.toLowerCase());
		if (!!d) cname.push('district-' + d.toLowerCase());
		if (!!cc) cname.push('country-' + cc.toLowerCase());

		html.className = cname.join(' ');

		if (typeof calculateRTLayout === 'function') calculateRTLayout();

	}

	function setLocale(payload, temp){
		
		var d = payload.D,
			cc = payload.CC,
			s = payload.S,
			e = expiry;

		storageEngine.setItem('localeD', d);
		storageEngine.setItem('localeCC', cc);
		storageEngine.setItem('localeS', s);

		if (!!temp) e = 600; // set only 600 seconds for failed geo crawl

		storageEngine.setItem('localeValid', new Date().setTime(new Date().getTime() + e));
		storageEngine.setItem('localeBuster', config.buster);
		
		window.onlocaleupdate();
	}

	var localExpired = false;
	
	if (storageEngine.getItem('localeValid') === null) localExpired = true;
	else {

		var cacheDate = new Date(+storageEngine.getItem('localeValid'));
		if (new Date().getTime() > cacheDate) localExpired = true;

	}

	if (storageEngine.getItem('localeBuster') === null) localExpired = true;
	else {
		if (storageEngine.getItem('localeBuster') !== config.buster) localExpired = true;
	}

	if (localExpired){		

		var request = new XMLHttpRequest();
		if (DEBUG) console.info('Getting GEO data...');		

		request.open('get', config.host + '?format=DFP&ts=' + (+ new Date()) + Math.random(), !config.sync);
		
		request.ontimeout = function(){
			setLocale({
				D : '',
				CC : 'HK',
				S : ''
			}, true);
		};

		request.onreadystatechange = function(xhr){
			if (request.readyState === 4 && request.status === 200) {

				var response = JSON.parse(request.responseText);
				if ('error' in response){
					setLocale({
						D : '',
						CC : 'HK',
						S : ''
					}, true);
					if (DEBUG) alert('GEO API returns an error: ' + response.error + '\nPlease go find Raymund');
				}

				else setLocale(JSON.parse(request.responseText).DFP);

			} else if (request.readyState === 4 && request.status !== 200) {

				setLocale({
					D : '',
					CC : 'HK',
					S : ''
				}, true);

			}
		}

		if (!config.sync) request.timeout = 5000;
		request.send();
		
	} else window.onlocaleupdate();	

	// add a button	
	var createGeoTest = function(){

		var select = $('<select style="z-index: 9999; border-radius: 0; font-family: arial; padding: 2px 20px; box-shadow: 2px 2px 3px rgba(0,0,0,.3); position:fixed; bottom: 5px; right: 5px; background: black; color: white; font-size: 16px"></select>');
		var r;

		$('<option value="-1">--- Emulate Location ---</option>').appendTo(select);
		$('<option value="hk">Hong Kong</option>').appendTo(select);
		$('<option value="sf">San Fran</option>').appendTo(select);
		$('<option value="ny">New York</option>').appendTo(select);
		$('<option value="la">LA</option>').appendTo(select);
		$('<option value="us">Other US region</option>').appendTo(select);
		$('<option value="manual">Manual entry</option>').appendTo(select);
		$('<option value="auto">Clear (fetch from API after reload)</option>').appendTo(select);

		select.on('change', function(e){
			switch($(this).val()){
				case 'hk': storageEngine.setItem('localeD', ''); storageEngine.setItem('localeCC', 'HK'); storageEngine.setItem('localeS', ''); break;
				case 'sf': storageEngine.setItem('localeD', '807'); storageEngine.setItem('localeCC', 'US'); storageEngine.setItem('localeS', 'CA'); break;
				case 'ny': storageEngine.setItem('localeD', '501'); storageEngine.setItem('localeCC', 'US'); storageEngine.setItem('localeS', 'NY'); break;
				case 'la': storageEngine.setItem('localeD', '803'); storageEngine.setItem('localeCC', 'US'); storageEngine.setItem('localeS', 'CA'); break;
				case 'us': storageEngine.setItem('localeD', '502'); storageEngine.setItem('localeCC', 'US'); storageEngine.setItem('localeS', 'WT'); break;
				case 'manual' : 

					r = prompt('Set D value (501/512/etc)\n Current value: ' + storageEngine.getItem('localeD'));
					if (r !== null){
						storageEngine.setItem('localeD', r.toUpperCase());
					}

					r = prompt('Set CC value (HK/US)\n Current value: ' + storageEngine.getItem('localeCC'));
					if (r !== null){
						storageEngine.setItem('localeCC', r.toUpperCase());
					}

					r = prompt('Set S value (CA/NY/etc)\n Current value: ' + storageEngine.getItem('localeS'));
					if (r !== null){
						storageEngine.setItem('localeS', r.toUpperCase());
					}
					break;

				case 'auto' : 
					storageEngine.removeItem('localeD');
					storageEngine.removeItem('localeCC');
					storageEngine.removeItem('localeS');
					storageEngine.removeItem('localeBuster');
					storageEngine.removeItem('localeValid');
					alert('cleared'); break;
				default : break;
			}

			if ($(this).val() !== 'auto'){
				storageEngine.setItem('localeBuster', config.buster);
				storageEngine.setItem('localeValid', new Date().setTime(new Date().getTime() + expiry));			
			}

			window.onlocaleupdate();

		}).appendTo($('body'));

	}

	window._geo = {		
		config : config,
		storage : storageEngine,
		test : createGeoTest
	}

})();