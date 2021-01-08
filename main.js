require('console-stamp')(console);

const NodeId3 = require('node-id3');
const recruse = require('recurse');
const Fs = require('fs');
const Path = require('path');

const output = [];

const filter = (path, stat) => {
	if (stat.isDirectory()) {
		return false;
	}
	
	return path.match(/\.(mp3|flac|wav|ogg|m4a)$/i);
}

console.info('Scanning directory...');

recruse('.', {writefilter: filter}).on('data', file => {
	const tags = NodeId3.read(file);
	output.push({
		dir: Path.dirname(file),
		file: Path.basename(file),
		album: tags?.['album'],
		artist: tags?.['artist'],
		title: tags?.['title']
	});
}).on('end', () => {
	console.info('Serialising...');
	const stringified = JSON.stringify(output); 

	console.info('Writing output file: output.json');
	Fs.writeFileSync('output.json', stringified);

	console.info('HTML-pagina samenstellen...');
	const htmlEntries = output.map(x => `
<tr>
<td>${x.artist ?? ''}</td>
<td>${x.title ?? ''}</td>
<td>${x.album ?? ''}</td>
<td>${x.dir ?? ''}</td>
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
<th>Map</th>
<th>Bestandsnaam</th>
</tr>
</thead>
<tbody>
${htmlEntries.join('\n')}
</tbody>
</table>
</body>
</html>`;
	console.info('HTML-pafina schrijven naar bestand: output.html');
	Fs.writeFileSync('output.html', html);
	
	console.info('Done!');
});
