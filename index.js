for (const element of document.querySelectorAll('.copy_on_click')) {
	element.addEventListener('click', copy)
}

function copy(event) {
	const text = event.target.innerHTML;
	navigator.clipboard.writeText(text);
	Toastify({
		text: "Copied to clipboard",
		duration: 2000
	}).showToast();
}



document.querySelector('#file_input').addEventListener('change', main);
// document.querySelector('#blank_table_button').addEventListener('click', ()=>{main({blank_table:true})});

async function main(options) {
	let confirmed_ids, unconfirmed_ids;

	if (options.blank_table) {
		confirmed_ids = [];
		unconfirmed_ids = [];
	} else {
		try {
			[confirmed_ids, unconfirmed_ids] = await read_player_log();
		} catch {
			if (['Player.log', 'Player-prev.log'].includes(document.querySelector('#file_input').files[0].name)) {
				window.alert("Couldn't find achievement data in file! Try launching GTFO again to regenerate the Player.log file.");
			} else {
				window.alert("Your Player.log file should be saved in C:\\<username>\\AppData\\LocalLow\\10 Chambers Collective\\GTFO. If you're having trouble, feel free to message @andocas on Discord.");
			}
			return;
		}
	}

	const logs = await logs_promise;

	for (const row of document.querySelectorAll('#log_table tbody tr')) {
		row.remove();
	}

	let done_count = 0;

	const table_body = document.querySelector('#log_table tbody');
	for (const log of logs) {
		const row = table_body.insertRow(-1);

		row.insertCell(0).innerHTML = log.expedition;

		if ('note' in log) {
			row.insertCell(1).innerHTML = `<span class="tooltip_activator">${log.zone} <img src="./info-circle.svg" style="height:1.5cap; vertical-align:middle;"><span class="tooltip">${log.note}</span></span>`
		} else {
			row.insertCell(1).innerHTML = log.zone;
		}

		row.insertCell(2).innerHTML = log.name;

		if (options.blank_table) {
			row.insertCell(3);
			row.className = 'unknown';
		} else if (confirmed_ids.includes(log.id)) {
			done_count++;
			row.insertCell(3).innerHTML = '✓';
			row.className = 'confirmed_read';
		} else if (unconfirmed_ids.includes(log.id)) {
			done_count++;
			row.insertCell(3).innerHTML = '(✓)';
			row.className = 'unconfirmed_read';
		} else {
			row.insertCell(3).innerHTML = '✗';
			row.className = 'not_read';
		}
	}

	if (options.blank_table) {
		document.querySelector('#progress').innerHTML = 'Click "Open Player.log" to view your progress.';
	} else {
		let progress = `${done_count}/${logs.length} (${(done_count/logs.length*100).toFixed(1)}%)`;
		if (done_count === logs.length) {
			progress += ' ✨';
		}
		document.querySelector('#progress').innerHTML = `Total progress: ${progress}`;
	}

	document.querySelector('#output').style.display = 'block';
}

async function read_player_log() {
	const file = document.querySelector('#file_input').files[0];
	const text = await file.text();

	const match = text.match(/AchievementManager \| <b>Achievement_ReadAllLogs<\/b> :: Initialized Data\. Logs Read: \d+ \/ \d+ \| IDs: \[([\d, ]*)\]/);
	const confirmed_ids = match[1].split(', ').map((id_str) => parseInt(id_str));

	const matches = text.matchAll(/AchievementManager \| <b>Achievement_ReadAllLogs<\/b> :: Read New Log: \[(\d+)\] \| \d+ \/ \d+/g);
	const unconfirmed_ids = Array.from(matches).map((match) => parseInt(match[1]));

	return [confirmed_ids, unconfirmed_ids];
}

async function fetch_logs() {
	const response = await fetch('./logs.json');
	const json = await response.json();
	return json
}

const logs_promise = fetch_logs();
main({blank_table: true});
