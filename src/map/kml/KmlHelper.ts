

import {extend} from 'tns-mobile-data-collector/src/utils';


const LogError = (...args) => {
	args.forEach((err) => {console.error(err); });
};
const LogWarning = (...args) => {
	args.forEach((warn) => {console.warn(warn); });
};
const PrintStackTrace = () => {};


export class KmlHelper {

	public ConvertKMLColorToRGB(colorString) {
		let colorStr = colorString.replace('#', '');
		while (colorStr.length < 6) {
			colorStr = '0' + colorStr;
		} // make sure line is dark!
		while (colorStr.length < 8) {
			colorStr = 'F' + colorStr;
		} // make sure opacity is a large fraction
		if (colorStr.length > 8) {
			colorStr = colorStr.substring(0, 8);
		}
		let color = colorStr.substring(6, 8) + colorStr.substring(4, 6) + colorStr.substring(2, 4);
		let opacity = ((parseInt(colorStr.substring(0, 2), 16)) * 1.000) / (parseInt("FF", 16));

		let rgbVal = {
			color: '#' + color,
			opacity: opacity
		};

		return rgbVal;
	}
	public ConvertRGBColorToKML(rgb, opacity) {

		let colorStr = rgb.replace('#', '');
		while (colorStr.length < 6) {
			colorStr = '0' + colorStr;
		} // make sure line is dark!
		if (colorStr.length > 6) {
			colorStr = colorStr.substring(0, 6);
		}

		let opacityNum = 1.0;
		if ((opacity != null)) {
			if (opacity >= 0.0 && opacity <= 1.0) {
				opacityNum = opacity;
			} else if (parseInt(opacity) >= 0.0 && parseInt(opacity) <= 1.0) {
				opacityNum = parseInt(opacity);
			}
		}


		opacityNum = (opacityNum * 255.0);
		let opacityStr = opacityNum.toString(16);

		let kmlStr = opacityStr.substring(0, 2) + "" + colorStr.substring(4, 6) + colorStr.substring(2, 4) + colorStr.substring(0, 2);

		return kmlStr;
	}



	ParseDomDocuments(xmlDom) {
		let docs = [];
		let docsDomNodes = xmlDom.getElementsByTagName('Document');
		let i;
		for (i = 0; i < docsDomNodes.length; i++) {
			let node = docsDomNodes.item(i);
			let docsData = extend({}, this.ParseDomDoc(node), this.ParseNonSpatialDomData(node, {}));
			let transform = function(options) {
				return options;
			};
			docs.push(transform(docsData));
		}
		return docs;
	}



	ParseDomFolders(xmlDom) {
		let folders = [];
		let folderDomNodes = this.ParseDomItems(xmlDom, 'Folder');
		let i;
		for (i = 0; i < folderDomNodes.length; i++) {
			let node = folderDomNodes[i];
			let folderData = extend({
				type: 'folder'
			}, this.ParseDomFolder(node), this.ParseNonSpatialDomData(node, {}));
			let transform = function(options) {
				return options;
			};
			folders.push(transform(folderData));
		}
		return folders;
	}

	ParseDomDoc(xmlDom) {
		return {};
	}

	ParseDomLinks(xmlDom) {
		let links = [];
		let linkDomNodes = xmlDom.getElementsByTagName('NetworkLink');
		let i;
		for (i = 0; i < linkDomNodes.length; i++) {
			let node = linkDomNodes.item(i);
			let linkData = extend({}, this.ParseDomLink(node), this.ParseNonSpatialDomData(node, {}));

			let transform = function(options) {
				return options;
			};
			links.push(transform(linkData));
		}
		return links;
	}
	ParseDomFolder(xmlDom) {
		return {};
	}
	ParseDomLink(xmlDom) {

		let urls = xmlDom.getElementsByTagName('href');
		let link = {
			type: 'link'
		};
		if (urls.length > 0) {
			let url = urls.item(0);
			link.url = this.Value(url);
		}
		return link;
	}

	ParseDomLines(xmlDom) {
		let lines = [];
		let lineDomNodes = this.ParseDomItems(xmlDom, 'LineString');
		let i;
		for (i = 0; i < lineDomNodes.length; i++) {

			let node = lineDomNodes[i];

			let polygonData = extend({
				type: 'line',
				lineColor: '#FF000000', // black
				lineWidth: 1,
				polyColor: '#77000000', // black semitransparent,
				coordinates: this.ParseDomCoordinates(node) // returns an array of GLatLngs
			},
				extend(
					this.ParseNonSpatialDomData(node, {}),
					this.ResolveDomStyle(this.ParseDomStyle(node), xmlDom)
				)
			);

			let rgb = this.ConvertKMLColorToRGB(polygonData.lineColor);
			polygonData.lineOpacity = rgb.opacity;
			polygonData.lineColor = rgb.color;

			lines.push(polygonData);
		}

		return lines;
	}

	ParseDomGroundOverlays(xmlDom) {
		let lines = [];
		let lineDomNodes = this.ParseDomItems(xmlDom, 'GroundOverlay');
		let i;
		for (i = 0; i < lineDomNodes.length; i++) {

			let node = lineDomNodes[i];

			let polygonData = extend({
				type: 'imageoverlay',
				icon: this.ParseDomIcon(node),
				bounds: this.ParseDomBounds(node)
			},
				this.ParseNonSpatialDomData(node, {})
			);

			lines.push(polygonData);
		}

		return lines;
	}

	ParseDomPolygons(xmlDom) {
		let polygons = [];
		let polygonDomNodes = this.ParseDomItems(xmlDom, 'Polygon');

		let i;
		for (i = 0; i < polygonDomNodes.length; i++) {

			let node = polygonDomNodes[i];

			let polygonData = extend({
				type: 'polygon',
				fill: true,
				lineColor: '#FF000000', // black
				lineWidth: 1,
				polyColor: '#77000000', // black semitransparent,
				coordinates: this.ParseDomCoordinates(node) // returns an array of google.maps.LatLng
			},
				extend(
					this.ParseNonSpatialDomData(node, {}),
					this.ResolveDomStyle(this.ParseDomStyle(node), xmlDom)
				)
			);

			let lineRGB = this.ConvertKMLColorToRGB(polygonData.lineColor);

			polygonData.lineOpacity = lineRGB.opacity;
			polygonData.lineColor = lineRGB.color;

			let polyRGB = this.ConvertKMLColorToRGB(polygonData.polyColor);

			polygonData.polyOpacity = (polygonData.fill) ? polyRGB.opacity : 0;
			polygonData.polyColor = polyRGB.color;


			polygons.push(polygonData);
		}
		return polygons;
	}

	ParseDomMarkers(xmlDom) {
		let markers = [];
		let markerDomNodes = this.ParseDomItems(xmlDom, 'Point');
		let i;
		for (i = 0; i < markerDomNodes.length; i++) {
			let node = markerDomNodes[i];
			let coords = this.ParseDomCoordinates(node);
			let marker = extend({
				type: 'point'
			}, {
				coordinates: coords[0] // returns an array of google.maps.LatLng
			}, this.ParseNonSpatialDomData(node, {}));
			let icon = this.ParseDomStyle(node);
			if (icon.charAt(0) == '#') {
				icon = this.ResolveDomStyle(icon, xmlDom).icon;
			}
			if (icon) {
				marker.icon = icon; // better to not have any hint of an icon (ie: icon:null) so that default can be used by caller
			}
			markers.push(marker);
		}
		return markers;
	}


	ParseDomCoordinates(xmlDom) {
		let coordNodes = xmlDom.getElementsByTagName('coordinates');
		if (!coordNodes.length) {
			LogWarning(['KmlHelper DOM Node did not contain coordinates!', {
				node: xmlDom
			}]);
			return null;
		}
		let node = coordNodes.item(0);
		let s = this.Value(node);
		s = s.trim();
		let coordStrings = s.split(' ');
		let coordinates = [];
		coordStrings.forEach((coord) => {
			let c = coord.split(',');
			if (c.length > 1) {

				// JSConsole([c[1],c[0]]);
				coordinates.push([parseFloat(c[1]), parseFloat(c[0])]);
			}

		});


		return coordinates;
	}
	ParseDomBounds(xmlDom) {
		let coordNodes = xmlDom.getElementsByTagName('LatLonBox');
		if (!coordNodes.length) {
			LogWarning(['KmlHelper DOM Node did not contain coordinates!', {
				node: xmlDom
			}]);
			return null;
		}
		let node = coordNodes.item(0);
		let norths = node.getElementsByTagName('north');
		let souths = node.getElementsByTagName('south');
		let easts = node.getElementsByTagName('east');
		let wests = node.getElementsByTagName('west');

		let north = null;
		let south = null;
		let east = null;
		let west = null;

		if (!norths.length) {
			LogWarning(['KmlHelper DOM LatLngBox Node did not contain north!', {
				node: xmlDom
			}]);
		} else {
			north = parseFloat(this.Value(norths.item(0)));
		}
		if (!souths.length) {
			LogWarning(['KmlHelper DOM LatLngBox Node did not contain south!', {
				node: xmlDom
			}]);
		} else {
			south = parseFloat(this.Value(souths.item(0)));
		}
		if (!easts.length) {
			LogWarning(['KmlHelper DOM LatLngBox Node did not contain east!', {
				node: xmlDom
			}]);
		} else {
			east = parseFloat(this.Value(easts.item(0)));
		}
		if (!wests.length) {
			LogWarning(['KmlHelper DOM LatLngBox Node did not contain west!', {
				node: xmlDom
			}]);
		} else {
			west = parseFloat(this.Value(wests.item(0)));
		}
		return {
			north: north,
			south: south,
			east: east,
			west: west
		};

	}

	ParseNonSpatialDomData(xmlDom, options) {
		let config = extend({}, {
			maxOffset: 2
		}, options);

		let data = {
			name: '',
			description: null,
			tags: {}
		};
		let names = xmlDom.getElementsByTagName('name');
		let i;
		for (i = 0; i < names.length; i++) {
			if (this.WithinOffsetDom(xmlDom, names.item(i), config.maxOffset)) {
				data.name = (this.Value(names.item(i)));
				break;
			}
		}
		let descriptions = xmlDom.getElementsByTagName('description');
		for (i = 0; i < descriptions.length; i++) {
			if (this.WithinOffsetDom(xmlDom, descriptions.item(i), config.maxOffset)) {
				data.description = (this.Value(descriptions.item(i)));
				break;
			}
		}

		if (xmlDom.hasAttribute('id')) {
			data.id = parseInt(xmlDom.getAttribute('id'), 10);
		}

		let tags = {};
		let extendedDatas = xmlDom.getElementsByTagName('ExtendedData');
		for (i = 0; i < extendedDatas.length; i++) {
			if (this.WithinOffsetDom(xmlDom, extendedDatas.item(i), config.maxOffset)) {
				let j;
				for (j = 0; j < extendedDatas.item(i).childNodes.length; j++) {
					let c = extendedDatas.item(i).childNodes.item(j);
					let t = this.ParseTag(c);
					if (t.name != '#text') {
						data.tags[t.name] = t.value;
					}
				}
			}
		}
		return data;
	}

	ParseTag(xmlDom) {
		let tags = {
			name: null,
			value: {}
		};
		switch (xmlDom.nodeName) {

			case 'Data': // TODO: add data tags...
			case 'data':
				break;
			case 'ID':
				tags.name = 'ID';
				tags.value = this.Value(xmlDom);
				break;
			default:
				tags.name = xmlDom.nodeName;
				tags.value = this.Value(xmlDom);
				break;
		}
		return tags;
	}
	WithinOffsetDom(parent, child, max) {
		let current = child.parentNode;
		for (let i = 0; i < max; i++) {
			if (current.nodeName == (typeof (parent) == 'string' ? parent : parent.nodeName)) {
				return true;
			}
			current = current.parentNode;
		}
		LogError(['KmlHelper Could not find parent node within expected bounds.', {
			parentNode: parent,
			childNode: child,
			bounds: max
		}]);
		return false;
	}
	ParseDomStyle(xmlDom, options?: any) {

		let config = extend({}, {
			defaultStyle: 'default'
		}, options);



		let styles = xmlDom.getElementsByTagName('styleUrl');
		let style = config.defaultStyle;
		if (styles.length == 0) {
			LogWarning(['KmlHelper DOM Node did not contain styleUrl!', {
				node: xmlDom,
				options: config
			}]);
		} else {
			let node = styles.item(0);
			style = (this.Value(node));
		}
		return style;
	}
	ParseDomIcon(xmlDom, options?: any) {

		let config = extend({}, {
			defaultIcon: false,
			defaultScale: 1.0
		}, options);



		let icons = xmlDom.getElementsByTagName('Icon');
		let icon = config.defaultStyle;
		let scale = config.defaultScale;
		if (icons.length == 0) {
			LogWarning(['KmlHelper DOM Node did not contain Icon!', {
				node: xmlDom,
				options: config
			}]);
		} else {
			let node = icons.item(0);
			let urls = node.getElementsByTagName('href');
			if (urls.length == 0) {
				LogWarning(['KmlHelper DOM Icon Node did not contain href!', {
					node: xmlDom,
					options: config
				}]);
			} else {
				let hrefNode = urls.item(0);
				icon = (this.Value(hrefNode));
			}

			let scales = node.getElementsByTagName('viewBoundScale');
			if (scales.length == 0) {
				LogWarning(['KmlHelper DOM Icon Node did not contain viewBoundScale!', {
					node: xmlDom,
					options: config
				}]);

			} else {
				let scaleNode = scales.item(0);
				scale = parseFloat(this.Value(scaleNode));
			}


		}
		return {
			url: icon,
			scale: scale
		};
	}
	ResolveDomStyle(style, xmlDom) {
		let data = {};
		let name = (style.charAt(0) == '#' ? style.substring(1, style.length) : style);
		let styles = xmlDom.getElementsByTagName("Style");
		let i;
		for (i = 0; i < styles.length; i++) {

			let node = styles.item(i);
			let id = node.getAttribute("id");
			if (id == name) {
				let lineStyles = node.getElementsByTagName('LineStyle');
				let polyStyles = node.getElementsByTagName('PolyStyle');
				let iconStyles = node.getElementsByTagName('href');
				if (lineStyles.length > 0) {
					let lineStyle = lineStyles.item(0);
					let colors = lineStyle.getElementsByTagName('color');
					if (colors.length > 0) {
						let color = colors.item(0);
						data.lineColor = this.Value(color);
					}
					let widths = lineStyle.getElementsByTagName('width');
					if (widths.length > 0) {
						let width = widths.item(0);
						data.lineWidth = this.Value(width);
					}
				}
				if (polyStyles.length > 0) {
					let polyStyle = polyStyles.item(0);
					let colors = polyStyle.getElementsByTagName('color');
					if (colors.length > 0) {
						let color = colors.item(0);
						data.polyColor = this.Value(color);
					}
					let outlines = polyStyle.getElementsByTagName('outline');
					if (outlines.length > 0) {
						let outline = outlines.item(0);
						let o = this.Value(outline);
						data.outline = (o ? true : false);
					}
				}
				if (iconStyles.length > 0) {
					let iconStyle = iconStyles.item(0);
					let icon = this.Value(iconStyle);
					data.icon = icon;
				}
			}
		}
		return data;
	}
	ParseDomItems(xmlDom, tag) {
		let tagName = tag || 'Point';
		let items = [];
		let markerDomNodes = xmlDom.getElementsByTagName(tagName);
		let i;
		for (i = 0; i < markerDomNodes.length; i++) {
			let node = markerDomNodes.item(i);
			if (tag == "GroundOverlay") {
				items.push(node);
				continue;
			}
			let parent = (node.parentNode.nodeName == 'Placemark' ? node.parentNode : (node.parentNode.parentNode.nodeName == 'Placemark' ? node.parentNode.parentNode : null));
			if (parent == null) {
				LogError(['Failed to find ParentNode for Element - ' + tagName, {
					node: xmlDom
				}]);
				PrintStackTrace();
			} else {
				items.push(parent);
			}
		}
		return items;
	}


	Value(node) {
		let value = node.nodeValue;
		if (value) return value;
		let str = "";
		try {
			if (node.childNodes && node.childNodes.length) this.ChildNodesArray(node).forEach((c) => {
				str += this.Value(c);
			});
		} catch (e) {
			LogError(['SimpleKML Parser Exception', e]);
		}
		return str;
	}

	ChildNodesArray(node) {
		let array = [];
		if (node.childNodes && node.childNodes.length > 0) {
			let i = 0;
			for (i = 0; i < node.childNodes.length; i++) {
				array.push(node.childNodes.item(i));
			}

		}
		return array;
	}

}