function calvinLine(p) {
	// p is array: [ {x:1,y:1}, {x:3,y:4}, etc ]
	if(p.length) {
		// console.log('calvinline', p);
		let path = '';
		path += `M${p[0].x},${p[0].y}`
		for(var i = 1; i < p.length; i++) {
			// console.log(p[i])

			// Originally I differentiated between what should be a straight line with what should be a bezier curve
			// if (p[i].curve) {
			// 	path += `C${(p[i].x - p[i-1].x)/2 + p[i-1].x} ${p[i-1].y}, ${p[i].x - (p[i].x - p[i-1].x)/2} ${p[i].y}, ${p[i].x} ${p[i].y}`
			// } else {
			// 	path += `L${p[i].x},${p[i].y}`;
			// }

			// actually works well even with no differentiation
			path += `C${(p[i].x - p[i-1].x)/2 + p[i-1].x} ${p[i-1].y}, ${p[i].x - (p[i].x - p[i-1].x)/2} ${p[i].y}, ${p[i].x} ${p[i].y}`
		}
		return path;
	}
}
