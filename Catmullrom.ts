// article: http://schepers.cc/getting-to-the-point
// source: http://schepers.cc/svg/path/catmullrom2bezier.js

type Point = { x: number; y: number }

export default function Catmullrom(points: Array<Point>) {
	if (points.length < 3) {
		return ""
	}

	const crp = points.reduce(
		(acc, point) => {
			acc.push(point.x)
			acc.push(point.y)
			return acc
		},
		[] as Array<number>
	)

	var d = ""
	for (var i = 0, iLen = crp.length; iLen - 2 > i; i += 2) {
		var p: Array<Point> = []
		const push = p.push.bind(p)
		if (0 == i) {
			p.push({ x: crp[i], y: crp[i + 1] })
			p.push({ x: crp[i], y: crp[i + 1] })
			p.push({ x: crp[i + 2], y: crp[i + 3] })
			p.push({ x: crp[i + 4], y: crp[i + 5] })
		} else if (iLen - 4 == i) {
			p.push({ x: crp[i - 2], y: crp[i - 1] })
			p.push({ x: crp[i], y: crp[i + 1] })
			p.push({ x: crp[i + 2], y: crp[i + 3] })
			p.push({ x: crp[i + 2], y: crp[i + 3] })
		} else {
			p.push({ x: crp[i - 2], y: crp[i - 1] })
			p.push({ x: crp[i], y: crp[i + 1] })
			p.push({ x: crp[i + 2], y: crp[i + 3] })
			p.push({ x: crp[i + 4], y: crp[i + 5] })
		}

		// Catmull-Rom to Cubic Bezier conversion matrix
		//    0       1       0       0
		//  -1/6      1      1/6      0
		//    0      1/6      1     -1/6
		//    0       0       1       0

		var bp: Array<Point> = []
		bp.push({ x: p[1].x, y: p[1].y })
		bp.push({
			x: (-p[0].x + 6 * p[1].x + p[2].x) / 6,
			y: (-p[0].y + 6 * p[1].y + p[2].y) / 6,
		})
		bp.push({
			x: (p[1].x + 6 * p[2].x - p[3].x) / 6,
			y: (p[1].y + 6 * p[2].y - p[3].y) / 6,
		})
		bp.push({ x: p[2].x, y: p[2].y })

		d +=
			"C" +
			bp[1].x +
			"," +
			bp[1].y +
			" " +
			bp[2].x +
			"," +
			bp[2].y +
			" " +
			bp[3].x +
			"," +
			bp[3].y +
			" "
	}

	if (points.length > 0) {
		d = "M" + points[0].x + "," + points[0].y + " " + d
	}

	return d
}
