import d3 from 'd3';
import jsonldVis from '../src/';
import data from './example.json';

jsonldVis(d3);

d3.jsonldVis(data, '#graph', { w: 800, h: 600, maxLabelWidth: 250 });
