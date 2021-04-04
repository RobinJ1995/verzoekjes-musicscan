const recruse = require('recurse');
const Fs = require('fs');
const Path = require('path');
const { v4: uuid } = require('uuid');
const prompt = require('prompt-sync')();
const MusicMetadata = require('music-metadata');

let startAnswer = null;
while (startAnswer !== 'ja') {
	console.info(`ℹ️ De volgende map zal worden gescand op audio-bestanden: ${process.cwd()}`);

	startAnswer = prompt('❓ Wil je verder gaan? (ja/nee) ');
	if (startAnswer === 'nee') {
		process.exit(0);
	} else if (startAnswer !== 'ja') {
		console.warn('⚠️ Ongeldig antwoord. Type "ja" om verder te gaan, of "nee" om het programma af te sluiten.');
	}

	console.log('');
}

const output = [];

const filter = (path, stat) => {
	if (stat.isDirectory()) {
		console.log(`📂 ${path}`);
		return false;
	}
	
	return path.match(/\.(mp3|flac|wav|ogg|m4a)$/i);
}

const parseTags = file => MusicMetadata.parseFile(file).then(x => x?.common);
const parseTasks = [];

console.info('⏳ Map scannen...');

recruse('.', {writefilter: filter}).on('data', file => {
	console.log(`📄 ${file}`);
	
	parseTasks.push(() => new Promise((resolve, reject) => {
		parseTags(file)
			.then(tags => {
				console.log(`🎵 ${tags?.['artist']} - ${tags?.['title']}`);
				
				output.push({
					key: uuid(),
					file: Path.basename(file),
					album: tags?.['album'],
					artist: tags?.['artist'],
					title: tags?.['title']
				});
			})
			.catch(err => {
				console.error(`🛑 Kan bestand niet verwerken: ${file}`);
				console.error(err);
				output.push({
					key: uuid(),
					file: Path.basename(file)
				});
			})
			.then(resolve);
	}));
}).on('end', async () => {
	console.info('ℹ️ Klaar met scannen.');
	
	console.info('⏳ Gevonden bestanden verwerken...');
	for (const parseTask of parseTasks) {
		await parseTask();
	}
	console.info('ℹ️ Klaar met verwerken.');
	
	console.info('⏳ Data converteren naar JSON-formaat...');
	const stringified = JSON.stringify(output, undefined, 4);
	
	console.info('⏳ Data wordt weggeschreven naar: output.json');
	Fs.writeFileSync('output.json', stringified);
	
	console.info('⏳ HTML-pagina samenstellen...');
	const htmlEntries = output.map(x => `
<tr>
<td>${x.artist ?? ''}</td>
<td>${x.title ?? ''}</td>
<td>${x.album ?? ''}</td>
<td>${x.file ?? ''}</td>
</tr>
`);
	const html = `<!DOCTYPE html>
<html>
<body>
<table border="1">
<thead>
<tr>
<th>Artiest</th>
<th>Titel</th>
<th>Album</th>
<th>Bestandsnaam</th>
</tr>
</thead>
<tbody>
${htmlEntries.join('\n')}
</tbody>
</table>
</body>
</html>`;
	console.info('⏳ HTML-pagina wordt weggeschreven naar: output.html');
	Fs.writeFileSync('output.html', html);
	
	console.info('✅ Klaar!');
	console.info('ℹ️ Druk op enter om het programma te beëindigen.');
	prompt();
});