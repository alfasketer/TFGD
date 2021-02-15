const triSet    = 0 //triangular fuzzy set
const trapSet   = 1 //trapezoid fuzzy set
const gausSet   = 2 //gausian fuzzy set
const lSet      = 3 //l-function fuzzy set
const rSet      = 4 //r-function fuzzy set

const aSum      = 0
const aSub      = 1
const aMul      = 2
const aDiv      = 3
const aRDiv     = 4

const aEzSum    = 10
const aEzSub    = 11
const aEzMul    = 12
const aEzDiv    = 13
const aEzRDiv   = 14

const eSum      = 20
const eSub      = 21
const eMul      = 22
const eDiv      = 23
const eRDiv     = 24

const intersect = 70
const iYeger    = 71
const iProduct  = 72
const iBProduct = 73
const iHamacher = 74

const union     = 80
const uYeger    = 81
const uProbSum  = 82
const uBSum     = 83
const uHamacher = 84

const invert    = 99

const glPadding = 0.5
const gausLimit = 160
const fillLimit = 1200
const eps       = 0.01
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
		this.operation = aSum
		this.opParam = 1
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

FuzzyNum.prototype.containsZero = function() {
    let set = [this.alphaCut(0, 0), this.alphaCut(0, 1)]
    if (set[0] < 0 && set[1] > 0) return true
    return false
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
			if(this.operation==aSum || this.operation==aEzSum)
				newarr.push(this.sets[0].alphaCut(value, i)+this.sets[1].alphaCut(value, j))
			if(this.operation==aSub || this.operation==aEzSub)
				newarr.push(this.sets[0].alphaCut(value, i)-this.sets[1].alphaCut(value, j))
			if(this.operation==aMul || this.operation==aEzMul)
				newarr.push(this.sets[0].alphaCut(value, i)*this.sets[1].alphaCut(value, j))
			if(this.operation==aDiv || this.operation == aEzDiv)
				newarr.push(this.sets[0].alphaCut(value, i)/this.sets[1].alphaCut(value, j))
			if(this.operation==aRDiv || this.operation == aEzRDiv)
				newarr.push(this.sets[1].alphaCut(value, i)/this.sets[0].alphaCut(value, j))
		}
	}

	return [Math.min.apply(Math, newarr), Math.max.apply(Math, newarr)]
}

GLViewport.prototype.getThirdLimits = function(larr, rarr) {
	let newarr = []
	for(i = 0; i < 2; i++)
		for(j = 0; j < 2; j++)
		{
			if(this.operation==aSum || this.operation==aEzSum || this.operation==eSum)
				newarr.push(larr[i]+rarr[j])
			if(this.operation==aSub || this.operation==aEzSub || this.operation==eSub)
				newarr.push(larr[i]-rarr[j])
			if(this.operation==aMul || this.operation==aEzMul  || this.operation==eMul)
				newarr.push(larr[i]*rarr[j])
			if(this.operation==aDiv || this.operation==aEzDiv || this.operation==eDiv)
				newarr.push(larr[i]/rarr[j])
			if(this.operation == aRDiv || this.operation == aEzRDiv || this.operation==eRDiv)
				newarr.push(rarr[j]/larr[i])
		}
	
	let min = Math.min.apply(Math, newarr)
	let max = Math.max.apply(Math, newarr)
	return [min, max]
}

GLViewport.prototype.alphaOperationData = function(z) {
	let points = []
	let data = []
	let i
	let limit = gausLimit
	if(this.operation>=aEzSum) limit = 1
	data.push(-999.00, 0.0, z)

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

GLViewport.prototype.getOppositeData = function(newx, x) {
	if(this.operation == eSum)      return newx - x
	if(this.operation == eSub) return x - newx
	if(this.operation == eMul) return newx / x
	if(this.operation == eDiv)   return x / newx
	if(this.operation == eRDiv)  return x * newx
}

GLViewport.prototype.extensionOperationData = function(z) {
	let set1 = [this.sets[0].alphaCut(0, 0), this.sets[0].alphaCut(0, 1)]
	let set2 = [this.sets[1].alphaCut(0, 0), this.sets[1].alphaCut(0, 1)]
	let limits = this.getThirdLimits(set1, set2)

	let data = []
	data.push(-999.0, 0.0, z, limits[0], 0.0, z)

	for(i=1; i<fillLimit; i++) {
		let newx = limits[0] + i/fillLimit*(limits[1]-limits[0])
        let tempdata = []
        if (Math.abs(newx) < eps && this.operation == eDiv) {
            let x1 = 0
            for(j=0; j<=fillLimit; j++) {
                let x2=set2[0] + j/fillLimit*(set2[1]-set2[0])
                tempdata.push(Math.min(this.sets[0].muFunction(x1), this.sets[1].muFunction(x2)))
            }
        }
        else {
            for(j=0; j<=fillLimit; j++) {
                let x1=set1[0] + j/fillLimit*(set1[1]-set1[0])
                let x2
                if(Math.abs(newx) < eps && this.operation == eRDiv) x2 = 0
                else x2=this.getOppositeData(newx, x1)
                if (x2 < set2[0] || x2 > set2[1]) continue
                tempdata.push(Math.min(this.sets[0].muFunction(x1), this.sets[1].muFunction(x2)))
            }
        }
		data.push(newx, Math.max.apply(Math, tempdata), z)
	}

	data.push(limits[1], 0.0, z, 999.0, 0.0, z)

	return data
}

GLViewport.prototype.getTNorms = function(a, b) {
	if (this.operation == intersect) return Math.min(a, b)
	if (this.operation == iYeger) {
		let temp = Math.pow(1-a, this.opParam) + Math.pow(1-b, this.opParam)
		return 1 - Math.min(1, Math.pow(temp, 1/this.opParam))
	}
	if (this.operation == iProduct) return a*b
	if (this.operation == iBProduct) return Math.max(0, a+b-1)
	if (this.operation == iHamacher) {
		let temp = this.opParam + (1-this.opParam)*(a+b-a*b)
		return a*b/temp
	}
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

	let llimit
	let rlimit
	let data = []

	let step = (this.right-this.left)/fillLimit
	for (x=this.left; x<=this.right; x+=step) {
		let y = this.getTNorms(this.sets[0].muFunction(x), this.sets[1].muFunction(x))
		data.push(x, y, z, x, 0.0, z)
	}

	return data
}

GLViewport.prototype.getTConorms = function(a, b) {
	if (this.operation == union) return Math.max(a, b)
	if (this.operation == uYeger) {
		let temp = Math.pow(a, this.opParam) + Math.pow(b, this.opParam)
		return Math.min(1, Math.pow(temp, 1/this.opParam))
	}
	if (this.operation == uProbSum) return a + b - a*b
	if (this.operation == uBSum) return Math.min(1, a+b)
	if (this.operation == uHamacher) {
		let temp1 = a + b - (2 - this.opParam)*a*b
		let temp2 = 1 - (1 - this.opParam)*a*b
		return temp1/temp2
	}
}

GLViewport.prototype.getUnionData = function(z) {
	let set1 = [this.sets[0].alphaCut(0, 0), this.sets[0].alphaCut(0, 1)]
	let set2 = [this.sets[1].alphaCut(0, 0), this.sets[1].alphaCut(0, 1)]

	let llimit
	let rlimit
	let data = []

	llimit = Math.min(set1[0], set2[0])
	rlimit = Math.max(set1[1], set2[1])

	let step = (this.right-this.left)/fillLimit
	for (x=this.left; x<=this.right; x+=step) {
		let y = this.getTConorms(this.sets[0].muFunction(x), this.sets[1].muFunction(x))
		data.push(x, y, z, x, 0.0, z)
	}

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
	//if (this.operation < aEzSum) return this.alphaOperationData(z)
	if (this.operation < eSum) return this.alphaOperationData(z)
	if (this.operation < intersect) return this.extensionOperationData(z)
	if (this.operation < union) return this.getIntersectData(z)
	if (this.operation < invert) return this.getUnionData(z)
	if (this.operation == invert) return this.getInvertData(z)
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

GLViewport.prototype.setViewport = function() {
	let set1 = [this.sets[0].alphaCut(0, 0), this.sets[0].alphaCut(0, 1)]
	let set2 = [this.sets[1].alphaCut(0, 0), this.sets[1].alphaCut(0, 1)]

	let larr = [set1[0]]
	let rarr = [set1[1]]

	if(this.operation != invert) {
		larr.push(set2[0])
		rarr.push(set2[1])
	}

	if(this.operation < intersect) {
		let set3 = this.getThirdLimits(set1, set2)
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

	gl.uniform3f(uColor,0.5,0.5,1)

	//операция
	data = this.getOperationData(-5.0)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

	identity()
	zRotate(-90)
	translate([-this.center, -0.5, 0])

	useMatrix()
	if (this.operation == intersect || this.operation == union) gl.drawArrays(gl.TRIANGLE_STRIP,0,data.length/3)
	gl.drawArrays(gl.LINE_STRIP,0,data.length/3)

	// първо множество
	this.drawSet(0)

	// второ множество
	if (this.operation != invert) this.drawSet(1)
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

	if (val == iYeger || val == iHamacher || val == uYeger || val == uHamacher)
		document.getElementById("paramBlock").style.display = "block"
	else document.getElementById("paramBlock").style.display = "none"
}


function changeTypeSelect() {
	let operations = []

	operations[0] = [
		["Simple α-cut Sum", aEzSum],
		["Complex α-cut Sum", aSum],
		["Extension Sum", eSum],
	]

	operations[1] = [
		["Simple α-cut Subtraction", aEzSub],
		["Complex α-cut Subtraction", aSub],
		["Extension Subtraction", eSub],
	]

	operations[2] = [
		["Simple α-cut Multiplication", aEzMul],
		["Complex α-cut Multiplication", aMul],
		["Extension Multiplication", eMul],
	]

	operations[3] = [
		["Simple α-cut Division(A/B)", aEzDiv],
		["Complex α-cut Division(A/B)", aDiv],
		["Extension Division(A/B)", eDiv],
    ]
	operations[4] = [
		["Simple α-cut Division(B/A)", aEzRDiv],
		["Complex α-cut Division(B/A)", aRDiv],
		["Extension Division(B/A)", eRDiv],
    ]

	operations[5] = [
		["Min Intersect", intersect],
		["Yeger Intersect", iYeger],
		["Product Intersect", iProduct],
		["Bounded Product Intersect", iBProduct],
		["Hamacher Intersect", iHamacher]
    ]
    
    operations[6] = [
		["Max Union", union],
		["Yeger Union", uYeger],
		["Probalistic Sum Union", uProbSum],
		["Bounded Sum Union", uBSum],
		["Hamacher Union", uHamacher]
    ]

    operations[7] = [
		["Inversion", invert]
    ]

	let val = parseInt(document.getElementById("type").value)
	let field = document.getElementById("op")
	let currlen = operations[currType].length
	for (i = 0; i < currlen; i++)
		field.remove(0);	

	currType = val
	currlen = operations[currType].length

	for (i = 0; i < currlen; i++) {
		option = document.createElement("option");
		option.text = operations[currType][i][0];
		option.value = String(operations[currType][i][1])
		field.add(option);
	}

    if (currType==3 || currType==4) {
        document.getElementById("division-check").style.display = "block"
    }
    else {
        document.getElementById("division-check").style.display = "none"
    }

	if (val < 5 && lrAllowed) {
		document.getElementById("set1").remove(3);
		document.getElementById("set1").remove(3);
		document.getElementById("set2").remove(3);
		document.getElementById("set2").remove(3);
		changeSetSelect(1)
		changeSetSelect(2)
		lrAllowed = false
	}
	else if (val >= 5 && !lrAllowed) {	
		let field
		let option

		for(i=1; i<=2; i++){
			field = document.getElementById("set" + i)
		
			option = document.createElement("option");
			option.text = "L-Fuzzy Set";
			option.value = String(lSet)
			field.add(option);

			option = document.createElement("option");
			option.text = "R-Fuzzy Set";
			option.value = String(rSet)
			field.add(option);
		}

		lrAllowed = true
	}

	changeOpSelect()
}

function checkValues(arr, setType) {
	var check = true
	let lens = [3, 4, 0, 2, 2]
	if (setType!=2) {
		//Check if every consecutive value is larger than the last
		let curr = arr[0]
		for(i = 1; i < lens[setType]; i++) {
			if(arr[i]<=curr) {
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
    let allowDiv = document.getElementById("divisionbox").checked

	vptest.operation = parseInt(document.getElementById("op").value)
	vptest.opParam = parseFloat(document.getElementById("opParam").value)
	vptest.clearSets()
	vptest.sets[0] = new FuzzyNum (setType1, arr1)
    vptest.sets[1] = new FuzzyNum (setType2, arr2)
    
	if (checkValues(arr1, setType1) == false) {
		alert("Invalid values for set 1!")
		ret = true
	}

	if (checkValues(arr2, setType2) == false) {
		alert("Invalid values for set 2!")
		ret = true
	}

	if ((vptest.operation == iYeger || vptest.operation == iHamacher || vptest.operation == uYeger || vptest.operation == uHamacher) && vptest.opParam <= 0) {
		alert("Invalid parameter!")
		ret = true
	}

    if((vptest.operation==aDiv || vptest.operation==aEzDiv || vptest.operation==eDiv) && vptest.sets[1].containsZero()) {
        alert("Second set contains a zero, can't divide!")
		ret = !allowDiv
    }

    if((vptest.operation==aRDiv || vptest.operation==aEzRDiv || vptest.operation==eRDiv) && vptest.sets[0].containsZero()) {
        alert("First set contains a zero, can't divide!")
		ret = !allowDiv
    }

	if (ret) return
	
	vptest.draw()
	document.getElementById("canvas-container").style.display = "flex"
}

currType = 0
lrAllowed = false
vptest = new GLViewport()
changeTypeSelect()
