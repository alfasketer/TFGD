const triSet    = 0 //triangular fuzzy set
const trapSet   = 1 //trapezoid fuzzy set
const gausSet   = 2 //gausian fuzzy set
const lSet      = 98 //l-function fuzzy set
const rSet      = 99 //r-function fuzzy set

const sum       = 0
const subtract  = 1
const multiply  = 2
const divide    = 3
const revdivide = 4
const simplemul = 5
const simplediv = 6
const simplrdiv = 7

const intersect = 81
const union     = 82
const invert    = 83

const glPadding = 0.5
const gausLimit = 160
const fillLimit = 1200
const eps       = 0.001
const cellSize  = 80

class FuzzyNum {
	constructor(fuzzyType, points) {
		this.type = fuzzyType
		this.points = points
	}
}

class GLViewport {
	constructor() {
		this.left = -1
		this.right = 1
		this.width = 2
		this.center = 0
		this.len = 0
		this.sets = []
		this.operation = sum
	}
}

FuzzyNum.prototype.alphaCut = function(alpha, side) {
	if (alpha < 0 || alpha > 1) {
		alert("Trying to call alpha cut with non-normalized alpha")
		console.log("alphaCut error: called with alpha: " + alpha + " & side: " + side)
		return NaN
	}
	if (this.type == triSet) {
		if (side == 0) return (this.points[1] - this.points[0]) * alpha + this.points[0]
		else return this.points[2] - alpha * (this.points[2] - this.points[1])
	}
	else if (this.type == trapSet) {
		if (side == 0) return (this.points[1] - this.points[0]) * alpha + this.points[0]
		else return this.points[3] - alpha * (this.points[3] - this.points[2])
	}
	else if (this.type == gausSet) {
		let loga
		if (alpha == 0) loga =  Math.log(alpha + eps)
		else loga = Math.log(alpha)
		let cut = Math.sqrt(-2 * this.points[1] * this.points[1] * loga)
		if (side == 0) return this.points[0] - cut
		else return this.points[0] + cut
	}
	else if (this.type == lSet || this.type == rSet) return this.points[side]
}

FuzzyNum.prototype.muFunction = function(x) {
	if (this.type == triSet) {
		let sideA = (x-this.points[0])/(this.points[1]-this.points[0])
		let sideB = (this.points[2]-x)/(this.points[2]-this.points[1])
		return Math.max(0, Math.min(sideA, sideB))
	}
	else if (this.type == trapSet) {
		let sideA = (x-this.points[0])/(this.points[1]-this.points[0])
		let sideB = (this.points[3]-x)/(this.points[3]-this.points[2])
		return Math.max(0, Math.min(1, sideA, sideB))
	}
	else if (this.type == gausSet) {
		return Math.exp(-1 * (x-this.points[0])*(x-this.points[0])/(2*this.points[1]*this.points[1]))
	}
	else if (this.type == lSet) {
		let val = (this.points[1]-x)/(this.points[1]-this.points[0])
		return Math.max(0, Math.min(1, val))
	}
	else if (this.type == rSet) {
		let val = (x-this.points[0])/(this.points[1]-this.points[0])
		return Math.max(0, Math.min(1, val))
	}
}

FuzzyNum.prototype.getData = function(z) {
	let data
	if (this.type == triSet) {
		data = [
			-999.00, 0.0, z,
			this.points[0].toFixed(2), 0.0, z,
			this.points[1].toFixed(2), 1.0, z,
			this.points[2].toFixed(2), 0.0, z,
			999.00, 0.0, z
		]
	}
	else if (this.type == trapSet) {
		data = [
			-999.00, 0.0, z,
			this.points[0].toFixed(2), 0.0, z,
			this.points[1].toFixed(2), 1.0, z,
			this.points[2].toFixed(2), 1.0, z,
			this.points[3].toFixed(2), 0.0, z,
			999.00, 0.0, z
		]
	}
	else if (this.type == gausSet) {
		data = []
		data.push(-999.00, 0.0, z)
		for(i = 0; i < gausLimit; i++) {
			data.push(this.alphaCut(i/gausLimit, 0), i/gausLimit, z)
		}
		data.push(this.points[0])
		data.push(1.0)
		data.push(z)
		for(i = gausLimit - 1; i >= 0; i--) {
			data.push(this.alphaCut(i/gausLimit, 1), i/gausLimit, z)
		}
		data.push(999.00, 0.0, z)
	}
	else if (this.type == lSet) {
		data = [
			-999.00, 1.0, z,
			this.points[0].toFixed(2), 1.0, z,
			this.points[1].toFixed(2), 0.0, z,
			999.00, 0.0, z
		]
	}
	else if (this.type == rSet) {
		data = [
			-999.00, 0.0, z,
			this.points[0].toFixed(2), 0.0, z,
			this.points[1].toFixed(2), 1.0, z,
			999.00, 1.0, z
		]
	}
	return data
}

GLViewport.prototype.getApprData = function(value) {
	let newarr = []

	for(i = 0; i < 2; i++) {
		for(j = 0; j < 2; j++) {
			if(this.operation==sum)
				newarr.push(this.sets[0].alphaCut(value, i)+this.sets[1].alphaCut(value, j))
			if(this.operation==subtract)
				newarr.push(this.sets[0].alphaCut(value, i)-this.sets[1].alphaCut(value, j))
			if(this.operation==multiply || this.operation==simplemul)
				newarr.push(this.sets[0].alphaCut(value, i)*this.sets[1].alphaCut(value, j))
			if(this.operation==divide || this.operation == simplediv)
				newarr.push(this.sets[0].alphaCut(value, i)/this.sets[1].alphaCut(value, j))
			if(this.operation==revdivide || this.operation == simplrdiv)
				newarr.push(this.sets[1].alphaCut(value, i)/this.sets[0].alphaCut(value, j))
		}
	}

	return [Math.min.apply(Math, newarr), Math.max.apply(Math, newarr)]
}

GLViewport.prototype.alphaOperationData = function(z) {
	let points = []
	let data = []
	let i
	let limit = gausLimit
	if(this.operation>divide) limit = 1
	data.push(-999.00, 0.0, z)

	console.log(this.getApprData(0.2, 0))

	i = 0
	while (true) {
		points.push(this.getApprData(i/limit))
		i++
		if (i > limit) break
	}

	for(i = 0; i <= limit; i++) {
		data.push(points[i][0], i/limit, z)
	}
	for(i = limit; i >= 0; i--) {
		data.push(points[i][1], i/limit, z)
	}
	data.push(999.00, 0.0, z)
	return data
}

GLViewport.prototype.get2LIntersectData = function(z) {
	let left = [Math.min(this.sets[0].points[0], this.sets[1].points[0]), Math.max(this.sets[0].points[0], this.sets[1].points[0])]
	let right = [Math.min(this.sets[0].points[1], this.sets[1].points[1]), Math.max(this.sets[0].points[1], this.sets[1].points[1])]
	let complex = false

	if(this.sets[0].points[0] > this.sets[1].points[0] && this.sets[0].points[1] < this.sets[1].points[1]) complex = true
	if(this.sets[1].points[0] > this.sets[0].points[0] && this.sets[1].points[1] < this.sets[0].points[1]) complex = true

	let data = [
		-999.00, 1.0, z,
		-999.00, 0.0, z,
		left[0], 1.0, z,
		left[0], 0.0, z
	]

	if (complex) {
		let k = (right[1]-right[0])/(right[1]-right[0]+left[1]-left[0])
		let newx = right[1] - k * (right[1]-left[0])
		data.push(newx, k, z, newx, 0.0, z)
	}

	data.push(right[0], 0.0, z)
	return data
}

GLViewport.prototype.get2RIntersectData = function(z) {
	let left = [Math.min(this.sets[0].points[0], this.sets[1].points[0]), Math.max(this.sets[0].points[0], this.sets[1].points[0])]
	let right = [Math.min(this.sets[0].points[1], this.sets[1].points[1]), Math.max(this.sets[0].points[1], this.sets[1].points[1])]
	let complex = false

	if(this.sets[0].points[0] > this.sets[1].points[0] && this.sets[0].points[1] < this.sets[1].points[1]) complex = true
	if(this.sets[1].points[0] > this.sets[0].points[0] && this.sets[1].points[1] < this.sets[0].points[1]) complex = true

	let data = [
		left[1], 0.0, z
	]

	if (complex) {
		let k = (right[1]-right[0])/(right[1]-right[0]+left[1]-left[0])
		let newx = right[1] - k * (right[1]-left[0])
		data.push(newx, k, z, newx, 0.0, z)
	}

	data.push(right[1], 1.0, z)
	data.push(right[1], 0.0, z)
	data.push(999.0, 1.0, z)
	data.push(999.0, 0.0, z)
	return data
}

GLViewport.prototype.getIntersectData = function(z) {
	let set1 = [this.sets[0].alphaCut(0, 0), this.sets[0].alphaCut(0, 1)]
	let set2 = [this.sets[1].alphaCut(0, 0), this.sets[1].alphaCut(0, 1)]

	let empty = true

	if (this.sets[0].type == lSet && set2[0]<set1[1]) empty = false
	if (this.sets[1].type == lSet && set1[0]<set2[1]) empty = false
	if (this.sets[0].type == rSet && set2[1]>set1[0]) empty = false
	if (this.sets[1].type == rSet && set1[1]>set2[0]) empty = false
	if (set2[0] <= set1[0] && set1[0] < set2[1])      empty = false
	if (set1[0] <= set2[0] && set2[0] < set1[1])      empty = false

	if (empty) {
		alert("Intersection is empty")
		return []
	}

	if (this.sets[0].type == lSet && this.sets[1].type == lSet) return this.get2LIntersectData(z)
	if (this.sets[0].type == rSet && this.sets[1].type == rSet) return this.get2RIntersectData(z)


	let llimit
	let rlimit
	let data = []

	if (this.sets[0].type == lSet) llimit = set2[0]
	else if (this.sets[1].type == lSet) llimit = set1[0]
	else llimit = Math.max(set1[0], set2[0])

	if (this.sets[0].type == rSet) rlimit = set2[1]
	else if (this.sets[1].type == rSet) rlimit = set1[1]
	else rlimit = Math.min(set1[1], set2[1])

	console.log(llimit, rlimit)

	data.push(llimit, 0.0, z)
	for (i = 1; i < fillLimit; i++) {
		let x = llimit + (rlimit-llimit)*i/fillLimit
		let y = Math.min(this.sets[0].muFunction(x), this.sets[1].muFunction(x))
		data.push(x, y, z, x, 0.0, z)
	}
	data.push(rlimit, 0.0, z)

	return data
}

GLViewport.prototype.get2LUnionData = function(z) {
	let left = [Math.min(this.sets[0].points[0], this.sets[1].points[0]), Math.max(this.sets[0].points[0], this.sets[1].points[0])]
	let right = [Math.min(this.sets[0].points[1], this.sets[1].points[1]), Math.max(this.sets[0].points[1], this.sets[1].points[1])]
	let complex = false

	if(this.sets[0].points[0] > this.sets[1].points[0] && this.sets[0].points[1] < this.sets[1].points[1]) complex = true
	if(this.sets[1].points[0] > this.sets[0].points[0] && this.sets[1].points[1] < this.sets[0].points[1]) complex = true

	let data = [
		-999.00, 1.0, z,
		-999.00, 0.0, z,
		left[1], 1.0, z,
		left[1], 0.0, z
	]

	if (complex) {
		let k = (right[1]-right[0])/(right[1]-right[0]+left[1]-left[0])
		let newx = right[1] - k * (right[1]-left[0])
		data.push(newx, k, z, newx, 0.0, z)
	}

	data.push(right[1], 0.0, z)
	return data
}

GLViewport.prototype.get2RUnionData = function(z) {
	let left = [Math.min(this.sets[0].points[0], this.sets[1].points[0]), Math.max(this.sets[0].points[0], this.sets[1].points[0])]
	let right = [Math.min(this.sets[0].points[1], this.sets[1].points[1]), Math.max(this.sets[0].points[1], this.sets[1].points[1])]
	let complex = false

	if(this.sets[0].points[0] > this.sets[1].points[0] && this.sets[0].points[1] < this.sets[1].points[1]) complex = true
	if(this.sets[1].points[0] > this.sets[0].points[0] && this.sets[1].points[1] < this.sets[0].points[1]) complex = true

	let data = [
		left[0], 0.0, z
	]

	if (complex) {
		let k = (right[1]-right[0])/(right[1]-right[0]+left[1]-left[0])
		let newx = right[1] - k * (right[1]-left[0])
		data.push(newx, k, z, newx, 0.0, z)
	}

	data.push(right[0], 1.0, z)
	data.push(right[0], 0.0, z)
	data.push(999.0, 1.0, z)
	data.push(999.0, 0.0, z)
	return data
}

GLViewport.prototype.getUnionData = function(z) {
	let set1 = [this.sets[0].alphaCut(0, 0), this.sets[0].alphaCut(0, 1)]
	let set2 = [this.sets[1].alphaCut(0, 0), this.sets[1].alphaCut(0, 1)]

	let empty = true

	if (this.sets[0].type == lSet && set2[0]<set1[1]) empty = false
	if (this.sets[1].type == lSet && set1[0]<set2[1]) empty = false
	if (this.sets[0].type == rSet && set2[1]>set1[0]) empty = false
	if (this.sets[1].type == rSet && set1[1]>set2[0]) empty = false
	if (set2[0] <= set1[0] && set1[0] < set2[1])      empty = false
	if (set1[0] <= set2[0] && set2[0] < set1[1])      empty = false

	if (empty) {
		alert("Intersection is empty")
		return []
	}

	if (this.sets[0].type == lSet && this.sets[1].type == lSet) return this.get2LUnionData(z)
	if (this.sets[0].type == rSet && this.sets[1].type == rSet) return this.get2RUnionData(z)


	let llimit
	let rlimit
	let data = []

	llimit = Math.min(set1[0], set2[0])
	rlimit = Math.max(set1[1], set2[1])

	console.log(llimit, rlimit)

	if (this.sets[0].type == lSet || this.sets[1].type == lSet)
		data.push(-999.0, 1.0, z, -999, 0.0, z, llimit, 1.0, z)

	data.push(llimit, 0.0, z)
	for (i = 1; i < fillLimit; i++) {
		let x = llimit + (rlimit-llimit)*i/fillLimit
		let y = Math.max(this.sets[0].muFunction(x), this.sets[1].muFunction(x))
		data.push(x, y, z, x, 0.0, z)
	}

	if (this.sets[0].type == rSet || this.sets[1].type == rSet)
		data.push(rlimit, 1.0, z, rlimit, 0.0, z, 999.0, 1.0, z, 999.0, 0.0, z)
	else data.push(rlimit, 0.0, z)

	return data
}

GLViewport.prototype.getInvertData = function(z) {
	let data = this.sets[0].getData(z)
	for(i=1; i<data.length; i+=3) {
		data[i] = 1-data[i]
	}
	return data
}

GLViewport.prototype.getOperationData = function(z) {
	if (this.operation < intersect) return this.alphaOperationData(z)
	if (this.operation == invert) return this.getInvertData(z)
	if (this.operation == intersect) return this.getIntersectData(z)
	if (this.operation == union) return this.getUnionData(z)
}

GLViewport.prototype.addSet = function(set) {
	this.sets[this.len] = set
	this.len++
}

GLViewport.prototype.clearSets = function() {
	for (i = 0; i < this.len; i++) this.sets.pop()
	this.len = 0
}

GLViewport.prototype.setLimits = function(left, right) {
	this.left = left - glPadding
	this.right = right + glPadding
}

GLViewport.prototype.getThirdCut = function(larr, rarr) {
	let newarr = []
	for(i = 0; i < 2; i++)
		for(j = 0; j < 2; j++)
		{
			if(this.operation==sum)
				newarr.push(larr[i]+rarr[j])
			if(this.operation==subtract)
				newarr.push(larr[i]-rarr[j])
			if(this.operation==multiply || this.operation==simplemul)
				newarr.push(larr[i]*rarr[j])
			if(this.operation==divide || this.operation==simplediv)
				newarr.push(larr[i]/rarr[j])
			if(this.operation == revdivide || this.operation == simplrdiv)
				newarr.push(rarr[j]/larr[i])
		}
	
	let min = Math.min.apply(Math, newarr)
	let max = Math.max.apply(Math, newarr)
	console.log(larr, rarr, newarr)
	return [min, max]
}

GLViewport.prototype.setViewport = function() {
	let set1 = [this.sets[0].alphaCut(0, 0), this.sets[0].alphaCut(0, 1)]
	let set2 = [this.sets[1].alphaCut(0, 0), this.sets[1].alphaCut(0, 1)]

	console.log("SET: ", set1)

	let larr = [set1[0]]
	let rarr = [set1[1]]

	if(this.operation != invert) {
		larr.push(set2[0])
		rarr.push(set2[1])
	}

	if(this.operation < intersect) {
		let set3 = this.getThirdCut(set1, set2)
		larr.push(set3[0])
		rarr.push(set3[1])
	}

	let left = Math.min.apply(Math, larr)
	let right = Math.max.apply(Math, rarr)

	this.left = Math.floor(left)
	if (left == this.left) this.left--
	this.right = Math.ceil(right)
	if (right == this.right) this.right++
	
	this.width = this.right-this.left
	this.center = (this.right+this.left)/2
	document.getElementById("bottom-left").innerHTML = this.left
	document.getElementById("bottom-right").innerHTML = this.right
}

GLViewport.prototype.drawSet = function(i) {
	let data = this.sets[i].getData(-2.0)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

	identity()
	zRotate(-90)
	translate([-this.center, -0.5, 0])

	useMatrix()
	gl.uniform3f(uColor,1*(1-i),1*i,0)
	gl.drawArrays(gl.LINE_STRIP,0,data.length/3)
}

GLViewport.prototype.draw = function() {
	this.setViewport()
	gl = getContext("gl-canvas")
	glprog = getProgram("vshader","fshader")
	
	aXYZ = gl.getAttribLocation(glprog,"aXYZ")
	uColor = gl.getUniformLocation(glprog,"uColor")
	uProjectionMatrix = gl.getUniformLocation(glprog,"uProjectionMatrix")
	uViewMatrix = gl.getUniformLocation(glprog,"uViewMatrix")
	uModelMatrix = gl.getUniformLocation(glprog,"uModelMatrix")

	gl.clearColor(1,1,1,1)
	gl.clear(gl.COLOR_BUFFER_BIT)

	let proj = orthoMatrix(this.width, 1.1, 1, 40000)
	gl.uniformMatrix4fv(uProjectionMatrix,false,proj)

	let view = viewMatrix([0.001,0,60], [0,0,0], [0,0,1])
	gl.uniformMatrix4fv(uViewMatrix,false,view)
	
	let buf = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER,buf)

	gl.enableVertexAttribArray(aXYZ)
	gl.vertexAttribPointer(aXYZ,3,gl.FLOAT,false,0,0)

	// рисуване на хоризонтални оси
	gl.uniform3f(uColor,0.8,0.8,0.8);
	identity()
	zRotate(-90)
	let hline = [-999.00, 0.0 , 0.0, 999.00, 0.0 , 0.0,]
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hline), gl.STATIC_DRAW);
	translate([0, -0.5, 0])
	for(i=0; i < 6; i++) {
		useMatrix()
		gl.drawArrays(gl.LINES,0,2)
		translate([0, 0.2, 0])
	}

	//рисуване на вертикални оси
	let vline = [0.0, 0.0 , 0.0, 0.0, 1.0 , 0.0]
	identity()
	zRotate(-90)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vline), gl.STATIC_DRAW);
	translate([-this.center+this.left, -0.5, 0])
	for(i=this.left; i <= this.right; i++) {
		translate([1, 0, 0])
		useMatrix()
		gl.drawArrays(gl.LINES,0,2)
	}

	// първо множество
	this.drawSet(0)

	// второ множество
	if (this.operation != invert) this.drawSet(1)

	gl.uniform3f(uColor,0,0,1)

	//операция
	data = this.getOperationData(-5.0)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

	identity()
	zRotate(-90)
	translate([-this.center, -0.5, 0])

	useMatrix()
	if (this.operation == intersect || this.operation == union) gl.drawArrays(gl.TRIANGLE_STRIP,0,data.length/3)
	gl.drawArrays(gl.LINE_STRIP,0,data.length/3)
}

function changeSetSelect(i) {
	let val = document.getElementById("set" + i).value 
	if (val==triSet) {
		document.getElementById("row" + i + "3").style.display = "table-row"
		document.getElementById("row" + i + "4").style.display = "none"
		document.getElementById("Formula" + i).src = "css/img/Tri.png"
	}
	else if(val == trapSet){
		document.getElementById("row" + i + "3").style.display = "table-row"
		document.getElementById("row" + i + "4").style.display = "table-row"
		document.getElementById("Formula" + i).src = "css/img/Trap.png"
	}
	else if(val == gausSet) {
		document.getElementById("row" + i + "3").style.display = "none"
		document.getElementById("row" + i + "4").style.display = "none"
		document.getElementById("Formula" + i).src = "css/img/Gauss.png"
	}
	else if(val == lSet) {
		document.getElementById("row" + i + "3").style.display = "none"
		document.getElementById("row" + i + "4").style.display = "none"
		document.getElementById("Formula" + i).src = "css/img/Lset.png"
	}
	else if(val == rSet) {
		document.getElementById("row" + i + "3").style.display = "none"
		document.getElementById("row" + i + "4").style.display = "none"
		document.getElementById("Formula" + i).src = "css/img/Rset.png"
	}
}

function changeOpSelect() {
	let val = parseInt(document.getElementById("op").value)
	if (val==invert) document.getElementById("fset2").style.display = "none"
	else document.getElementById("fset2").style.display = "block"
	if (val < 80 && lrAllowed) {
		document.getElementById("set1").remove(3);
		document.getElementById("set1").remove(3);
		document.getElementById("set2").remove(3);
		document.getElementById("set2").remove(3);
		changeSetSelect(1)
		changeSetSelect(2)
		lrAllowed = false
	}
	else if (val >= 80 && !lrAllowed) {	
		let field
		let option

		for(i=1; i<=2; i++){
			field = document.getElementById("set" + i)
		
			option = document.createElement("option");
			option.text = "L-Fuzzy Set";
			option.value = "98"
			field.add(option);

			option = document.createElement("option");
			option.text = "R-Fuzzy Set";
			option.value = "99"
			field.add(option);
		}

		lrAllowed = true
	}
}

function checkValues(arr, setType) {
	var check = true
	console.log(arr, setType)
	if (setType<2) {
		//Check if every consecutive value is larger than the last
		curr = arr[0]
		for(i = 1; i < 3+setType; i++) {
			if(arr[i]<curr) {
				check = false
				break
			} else {
				curr = arr[i]
			}
		}
	} else if (setType == 2) {
		check = (arr[1]>0) // check if the value is over 0
	}
	return check
}

function generate() {
	let arr1 = []
	let arr2 = []
	let ret = false


	for (i = 1; i<5; i++) {
		arr1[i-1] = parseFloat(document.getElementById("input1" + i).value)
		arr2[i-1] = parseFloat(document.getElementById("input2" + i).value)
	}

	let setType1 = parseInt(document.getElementById("set1").value)
	let setType2 = parseInt(document.getElementById("set2").value)

	if (checkValues(arr1, setType1) == false) {
		alert("Invalid values for set 1!")
		ret = true
	}

	if (checkValues(arr2, setType2) == false) {
		alert("Invalid values for set 2!")
		ret = true
	}

	if (ret) return

	vptest.clearSets()
	vptest.sets[0] = new FuzzyNum (setType1, arr1)
	vptest.sets[1] = new FuzzyNum (setType2, arr2)
	vptest.operation = parseInt(document.getElementById("op").value)
	vptest.draw()
	document.getElementById("canvas-container").style.display = "flex"
}

lrAllowed = false
vptest = new GLViewport()

