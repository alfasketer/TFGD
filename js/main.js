const triSet  = 0 //triangular fuzzy set
const trapSet = 1 //trapezoid fuzzy set
const gausSet = 2 //gausian fuzzy set
const rSet    = 3 //r-function fuzzy set
const lSet    = 4 //l-function fuzzy set

class FuzzyNum {
	constructor(fuzzyType, points) {
		this.type = fuzzyType
		this.points = points
		this.alphaCut = function(alpha, side) {
			console.log("attempting alpha cut")
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
			else {
				let cut = Math.sqrt(-2 * this.points[1] * this.points[1] * Math.log(alpha))
				if (side == 0) return this.points[0] - cut
				else return this.points[0] + cut
			}
		}
	}
}

console.log("test")