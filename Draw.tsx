import * as React from "react"
import * as _ from "lodash"
import * as glamor from "glamor"
import Component from "reactive-magic/component"
import { Value } from "reactive-magic"
import Catmullrom from "./Catmullrom"

type Point = { x: number; y: number }

const offset = glamor.keyframes("offset", {
	to: {
		strokeDashoffset: 0,
	},
})

export default class Draw extends Component<{}> {
	private dragging = new Value(false)
	private animate = new Value(false)
	private paths = new Value<Array<Array<Point>>>([])
	private pathRefs: { [key: number]: SVGPathElement } = {}

	private handlePathRef = (index: number) => (path: SVGPathElement | null) => {
		if (path) {
			this.pathRefs[index] = path
		}
	}

	didUpdate() {
		const paths = this.paths.get()
		const pathRefs = this.pathRefs
		for (let i = 0; i < paths.length; i++) {
			const element = pathRefs[i]
			if (element) {
				if (this.animate.get()) {
					const length = element.getTotalLength()
					element.style.strokeDasharray = length + "px"
					element.style.strokeDashoffset = length + "px"
					element.style.animation = offset + " 0.45s linear forwards"
					element.style.animationDelay = "0s"
				} else {
					element.style.strokeDasharray = null
					element.style.strokeDashoffset = null
					element.style.animation = null
					element.style.animationDelay = null
				}
			}
		}
	}

	view() {
		const paths = this.paths.get()
		return (
			<div>
				<div
					onMouseDown={this.handleMouseDown}
					onMouseMove={this.handleMouseMove}
					onMouseUp={this.handleMouseUp}
					onMouseLeave={this.handleMouseLeave}
					style={{
						height: 400,
						width: 400,
						border: "1px solid black",
						borderRadius: 4,
					}}
				>
					<svg
						style={{
							height: 400,
							width: 400,
						}}
					>
						{paths.map((path, index) => {
							return (
								<path
									ref={this.handlePathRef(index)}
									key={index}
									stroke="#BADA55"
									strokeWidth="2"
									fill="none"
									d={Catmullrom(path)}
								/>
							)
						})}
					</svg>
				</div>
				<button onClick={this.handleUndo}>undo</button>
				<button onClick={this.handleAnimate}>animate</button>
			</div>
		)
	}

	private handleMouseDown = _.throttle(
		(e: React.MouseEvent<HTMLDivElement>) => {
			this.dragging.set(true)
			this.paths.update(paths => [...paths, [{ x: e.clientX, y: e.clientY }]])
		}
	)

	private handleMouseMove = _.throttle(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (this.dragging.get()) {
				this.paths.update(paths => {
					const initial = paths.slice(0, paths.length - 1)
					const last = paths[paths.length - 1]
					return [...initial, [...last, { x: e.clientX, y: e.clientY }]]
				})
			}
		}
	)

	private handleMouseUp = _.throttle((e: React.MouseEvent<HTMLDivElement>) => {
		this.dragging.set(false)
	})

	private handleMouseLeave = _.throttle(
		(e: React.MouseEvent<HTMLDivElement>) => {
			this.dragging.set(false)
		}
	)

	private handleUndo = () => {
		this.paths.update(paths => paths.slice(0, paths.length - 1))
	}

	private handleAnimate = () => {
		this.animate.update(value => !value)
		this.forceUpdate()
	}
}
