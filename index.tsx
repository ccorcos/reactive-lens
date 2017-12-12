import * as React from "react"
import * as ReactDOM from "react-dom"
import { css } from "glamor"
import Draw from "./Draw"

css.global("a", {
	color: "inherit",
	textDecoration: "none",
})

css.global("html, body", {
	margin: 0,
	padding: 0,
})

const root = document.getElementById("root")
ReactDOM.render(<Draw />, root)
