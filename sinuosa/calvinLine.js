function calvinLine(p) {
	// p is array: [ {x:1,y:1}, {x:3,y:4}, etc ]
	if (p.length) {
		// console.log('calvinline',p);
		let path = '';
		path += `M${p[0].x},${p[0].y}`
		for (var i=1; i<p.length; i++){
			path += `L${p[i].x},${p[i].y}`;
			// if (p[i-1].y == p[i].y) {
			// 	path += `H${p[i].x}`
			// } else if (p[i-1].x == p[i].x && p[i-1].y < p[i].y) {
			// 	// draw 180 degrees arc
			// 	let r = (p[i-1].x == p[i].x)/2
			// 	path += `A ${r} ${r} 0 0 1 ${p[i].x} ${p[i].y}`
			// } else if ( (p[i-1].x - p[i].x) == (p[i-1].y - p[i].y) ) {
			// 	// // draw 90 degrees arc
			// 	let l = Math.abs((p[i-1].x - p[i].x)/1) * 0.552284749831;
			//
			// 	if ( i>1 && p[i-1].y == p[i-2].y ) {
			// 		path += `C${p[i-1].x+l} ${(p[i-1].y)}, ${(p[i].x)} ${p[i].y-l}, ${p[i].x} ${p[i].y}`
			// 	} else {
			// 		path += `C${p[i-1].x} ${(p[i-1].y+l)}, ${(p[i].x-l)} ${p[i].y}, ${p[i].x} ${p[i].y}`
			// 	}
			// } else {
			// 	path += `L${p[i].x},${p[i].y}`
			// }
		}
		return path;
	}

}
