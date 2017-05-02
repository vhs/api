"use strict";

function getLine() {
	return ((new Error().stack).split("at ")[2]).trim().split(":")[1];
}

module.exports.getLine = getLine;