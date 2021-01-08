const NodeId3 = require('node-id3');
const recruse = require('recurse');
const Fs = require('fs');
const Path = require('path');
const { v4: uuid } = require('uuid');
const prompt = require('prompt-sync')();

let startAnswer = null;
while (startAnswer !== 'ja') {
	console.info(`De volgende map zal worden gescand op audio-bestanden: ${process.cwd()}`);

	startAnswer = prompt('Wil je verder gaan? (ja/nee) ');
	if (startAnswer === 'nee') {
		process.exit(0);
	} else if (startAnswer !== 'ja') {
		console.warn('Ongeldig antwoord. Type "ja" om verder te gaan, of "nee" om het programma af te sluiten.');
	}

	console.log('');
}

require('console-stamp')(console);
const output = [];

const filter = (path, stat) => {
	if (stat.isDirectory()) {
		console.log(`> ${path}`);
		return false;
	}
	
	return path.match(/\.(mp3|flac|wav|ogg|m4a)$/i);
}

console.info('Map scannen...');

recruse('.', {writefilter: filter}).on('data', file => {
	const tags = NodeId3.read(file);
	output.push({
		key: uuid(),
		file: Path.basename(file),
		album: tags?.['album'],
		artist: tags?.['artist'],
		title: tags?.['title']
	});
}).on('end', () => {
	console.info('Data converteren naar JSON-formaat...');
	const stringified = JSON.stringify(output); 

	console.info('Data wordt weggeschreven naar: output.json');
	Fs.writeFileSync('output.json', stringified);

	console.info('HTML-pagina samenstellen...');
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
	console.info('HTML-pagina wordt weggeschreven naar: output.html');
	Fs.writeFileSync('output.html', html);
	
	console.info('Klaar!');
	console.info('Druk op enter om het programma te beëindigen.');
	prompt();
});
