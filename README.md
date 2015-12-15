# JSON-LD visualization

Turn JSON-LD into pretty graphs

<p align="center">
  <img src="example/screen1.png" width="400" />
</p>
<p align="center">
  <img src="example/screen3.png" width="400" />
</p>
<p align="center">
  <img src="example/screen5.png" width="400" />
</p>

### Usage

See the `examples/` folder for usage details.

Import `jsonld-vis.js` and `jsonld-vis.css`. Be sure to include the dependencies `d3` and `d3-tip`.

To initialize, simply load data into the `jsonldVis` function:

```js
d3.json('example.json', function(err, data) {
  if (err) return console.warn(err);
  d3.jsonldVis(data, '#graph', { w: 800, h: 600, maxLabelWidth: 250 });
});
```

#### d3.jsonldVis(data, querySelector[, config])

Where the optional `config` variable is as follows:

```js
{
  h: 600, //height
  w: 800, //width
  maxLabelWidth: 250, // maximum label width
  transitionDuration: 750, // transition duration, in ms
  transitionEase: 'cubic-in-out', // trasition easing function
  radius: 5 // minimum node radius
}
```

The width is for initialization purposes. The width of the svg element will dynamically be adjusted as necessary.

For any labels that are smaller than maximum label width, hover over the node to see the full label:

<p align="center">
  <img src="example/screen2.png" height="150" />
  <img src="example/screen4.png" height="150" />
</p>

### License

[Apache 2.0](https://github.com/scienceai/jsonld-vis/blob/master/LICENSE)
