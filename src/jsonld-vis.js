
/* globals d3 */
/* eslint no-shadow: "off" */

import d3 from 'd3';
import d3Tip from 'd3-tip';

d3Tip(d3);

export default function (d3) {
  d3.jsonldVis = jsonldVis;
}

function jsonldVis (jsonld, selector, config = {}) {
  if (!jsonld && !selector) return jsonldVis;

  let h = config.h || 600
    , w = config.w || 800
    , maxLabelWidth = config.maxLabelWidth || 250
    , transitionDuration = config.transitionDuration || 750
    , transitionEase = config.transitionEase || 'cubic-in-out'
    , minRadius = config.minRadius || 5
    , scalingFactor = config.scalingFactor || 2
    , i = 0
    , tree = d3.layout.tree().size([h, w])
    , diagonal = d3.svg.diagonal().projection(d => [d.y, d.x])
    , svg = d3.select(selector).append('svg')
              .attr('width', w)
              .attr('height', h)
              .append('g')
              .attr('transform', 'translate(' + maxLabelWidth + ',0)')
    , tip = d3.tip()
              .direction(d => (d.children || d._children ? 'w' : 'e'))
              .offset(d => (d.children || d._children ? [0, -3] : [0, 3]))
              .attr('class', 'd3-tip')
              .html(d => '<span>' + d.valueExtended + '</span>')
  ;
  svg.call(tip);

  let root = jsonldTree(jsonld);
  root.x0 = h / 2;
  root.y0 = 0;
  root.children.forEach(collapse);

  function changeSVGWidth (newWidth) {
    if (w !== newWidth) d3.select(selector + ' > svg').attr('width', newWidth);
  }

  function jsonldTree (source) {
    let tree = {};
    if ('@id' in source) {
      tree.isIdNode = true;
      tree.name = source['@id'];
      if (tree.name.length > maxLabelWidth / 9) {
        tree.valueExtended = tree.name;
        tree.name = '…' + tree.valueExtended.slice(-Math.floor(maxLabelWidth / 9));
      }
    }
    else {
      tree.isIdNode = true;
      tree.isBlankNode = true;
      // random id, can replace with actual uuid generator if needed
      tree.name = '_:b' + Math.random().toString(10).slice(-7);
    }

    let children = [];
    Object.keys(source).forEach(key => {
      if (key === '@id' || key === '@context' || source[key] === null) return;
      let valueExtended
        , value
      ;
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        children.push({
          name: key,
          children: [jsonldTree(source[key])]
        });
      }
      else if (Array.isArray(source[key])) {
        children.push({
          name: key,
          children: source[key].map(item => {
            if (typeof item === 'object') return jsonldTree(item);
            return { name: item };
          })
        });
      }
      else {
        valueExtended = source[key];
        value = valueExtended;
        if (value.length > maxLabelWidth / 9) {
          value = value.slice(0, Math.floor(maxLabelWidth / 9)) + '…';
          children.push({
            name: key,
            value,
            valueExtended,
          });
        }
        else {
          children.push({
            name: key,
            value,
          });
        }
      }
    });

    if (children.length) tree.children = children;
    return tree;
  }

  function update (source) {
    let nodes = tree.nodes(root).reverse()
      , links = tree.links(nodes)
    ;
    nodes.forEach(d => (d.y = d.depth * maxLabelWidth));
    let node = svg.selectAll('g.node')
                  .data(nodes, d => (d.id || (d.id = ++i)))
      , nodeEnter = node.enter()
                        .append('g')
                        .attr('class', 'node')
                        .attr('transform', () => `translate(${source.y0},${source.x0})`)
                        .on('click', click)
    ;
    nodeEnter.append('circle')
              .attr('r', 0)
              .style('stroke-width', d => (d.isIdNode ? '2px' : '1px'))
              .style('stroke', d => (d.isIdNode ? '#F7CA18' : '#4ECDC4'))
              .style('fill', d => {
                if (d.isIdNode) return d._children ? '#F5D76E' : 'white';
                return d._children ? '#86E2D5' : 'white';
              })
              .on('mouseover', d => { if (d.valueExtended) tip.show(d); })
              .on('mouseout', tip.hide)
    ;
    nodeEnter.append('text')
              .attr('x', d => {
                let spacing = computeRadius(d) + 5;
                return d.children || d._children ? -spacing : spacing;
              })
              .attr('dy', '4')
              .attr('text-anchor', d => (d.children || d._children ? 'end' : 'start'))
              .text(d => (d.name + (d.value ? ': ' + d.value : '')))
              .style('fill-opacity', 0)
              .on('mouseover', d => { if (d.valueExtended) tip.show(d); })
              .on('mouseout', tip.hide)
    ;
    let maxSpan = Math.max.apply(Math, nodes.map(d => d.y + maxLabelWidth));
    if (maxSpan + maxLabelWidth + 20 > w) {
      changeSVGWidth(maxSpan + maxLabelWidth);
      d3.select(selector).node().scrollLeft = source.y0;
    }

    let nodeUpdate = node.transition()
                          .duration(transitionDuration)
                          .ease(transitionEase)
                          .attr('transform', d => `translate(${d.y},${d.x})`)
    ;
    nodeUpdate.select('circle')
              .attr('r', d => computeRadius(d))
              .style('stroke-width', d => (d.isIdNode ? '2px' : '1px'))
              .style('stroke', d => (d.isIdNode ? '#F7CA18' : '#4ECDC4'))
              .style('fill', d => {
                if (d.isIdNode) return d._children ? '#F5D76E' : 'white';
                return d._children ? '#86E2D5' : 'white';
              })
    ;
    nodeUpdate.select('text').style('fill-opacity', 1);

    let nodeExit = node.exit().transition()
                      .duration(transitionDuration)
                      .ease(transitionEase)
                      .attr('transform', () => `translate(${source.y},${source.x})`)
                      .remove()
    ;
    nodeExit.select('circle').attr('r', 0);
    nodeExit.select('text').style('fill-opacity', 0);

    let link = svg.selectAll('path.link').data(links, d => d.target.id);
    link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', () => {
          let o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        })
    ;
    link.transition()
        .duration(transitionDuration)
        .ease(transitionEase)
        .attr('d', diagonal);
    link.exit().transition()
        .duration(transitionDuration)
        .ease(transitionEase)
        .attr('d', () => {
          let o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        })
        .remove()
    ;

    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  function computeRadius (d) {
    if (d.children || d._children) return minRadius + (numEndNodes(d) / scalingFactor);
    return minRadius;
  }

  function numEndNodes (n) {
    let num = 0;
    if (n.children) n.children.forEach(c => (num += numEndNodes(c)));
    else if (n._children) n._children.forEach(c => (num += numEndNodes(c)));
    else num++;
    return num;
  }

  function click (d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    }
    else {
      d.children = d._children;
      d._children = null;
    }
    update(d);

    // fast-forward blank nodes
    if (d.children) {
      d.children.forEach(child => {
        if (child.isBlankNode && child._children) click(child);
      });
    }
  }

  function collapse (d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }
  update(root);
}
