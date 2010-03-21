/*!
 * GrassMudMonkey - an Open Souce GrassMudHorse/Whitespace Engine Written in JavaScript
 * @author: Dexter.Yy (dexter.yy at gmail.com)
 * @version: 1.2
 * @licence GPLv3(http://www.gnu.org/licenses/gpl.html)
 * @homepage: http://www.limboy.com
 * GrassMudHorse homepage: http://code.google.com/p/grass-mud-horse/
 * Whitespace homepage: http://compsoc.dur.ac.uk/whitespace/
 */ 
var GrassMudMonkey = (function(){
	var stack = [],
	    heap = {},
	    marks = {},
	    sub = {},
	    args = {},
	    //trace = {},
	    near = 0,
	    count = 0,
	    offset = 0;

	var valid = { "草": 1, "泥": 1, "马": 1 };

	var table = {
		// Stack Manipulation
		"草草": [0, function(num){ stack.push(num); }], 											// push, signed
		"草马草": [function(){ stack.push(stack[stack.length-1]); }], 								// dup,
		"草泥草": [0, function(n){ stack.push(stack[n - 1]); }], 									// copy, signed
		"草马泥": [function(){ stack.splice(-1, 0, stack.pop()); }], 								// swap
		"草马马": [function(){ stack.pop(); }],														// discard
		"草泥马": [0, function(n){ stack.splice(0 - 1 - n, n); }],									// slide, signed
		// Arithmetic
		"泥草草草": [function(){ stack.push(stack.pop() + stack.pop()); }], 						// add 
		"泥草草泥": [function(){ stack.push(stack.pop() - stack.pop()); }], 						// sub
		"泥草草马": [function(){ stack.push(stack.pop() * stack.pop()); }], 						// mul
		"泥草泥草": [function(){ stack.push(stack.pop() / stack.pop()); }], 						// div
		"泥草泥泥": [function(){ stack.push(stack.pop() % stack.pop()); }], 						// mod
		// Heap Access
		"泥泥草": [function(){ var v = stack.pop(); heap[stack.pop()] = v; }], 						// store
		"泥泥泥": [function(){ stack.push(heap[stack.pop()]); }], 									// retrieve
		// Flow Control
		"马草草": [1, function(label){ return sub[label]; }],										// label, unsigned
		"马草泥": [, function(label){ args[sub[label]] = count; return marks[label]; }], 			// call, unsigned
		"马草马": [, function(label){ return marks[label]; }], 										// jump, unsigned
		"马泥草": [, function(label){ if (0 == stack.pop()) return marks[label]; }], 				// jz, unsigned
		"马泥泥": [, function(label){ if (0 > stack.pop()) return marks[label]; }], 				// jn, unsigned
		"马泥马": [2, function(line){ return line; }], 												// ret
		"马马马": [function(){ throw new Error("exit"); }], 										// exit
		// IO
		"泥马草草": [function(){ var r = stack.pop(); put(r == 10 && '\n' || r); }], 				// outchar
		"泥马草泥": [function(){ put(stack.pop()); }], 												// outnum
		"泥马泥草": [function(){ heap[stack.pop()] = getInput(); }], 								// readchar
		"泥马泥泥": [function(){ heap[stack.pop()] = parseInt(getInput()); }] 						// readnum
	};

	function put(src){
		var result = src;
		//if (window.console)
			//window.console.info(result);
		if (interpreter.print)
			interpreter.print(src);
		else
			alert(result);
	}

	function getInput(){}

	function lexer(code, path){
		var token,
			cmd,
			tree = [],
			cache = [],
			timer = +new Date();

		if (!code[0]) // for ie8-
			code = code.split('');

		while (token = code[offset++]) {
			if (!valid[token])
				continue;
			if (!path) {
				cache.push(token);
				cmd = table[cache.join('')];
				if (!cmd) {
					continue;
				} else {
					if (typeof cmd[0] === "function") { 					// no argument
						tree.push(cmd[0]);
					} else if (2 === cmd[0]) { 								// define subroutine
						tree.push(cmd[1]);
						sub[args[near]] = count;
						near = 0;
					} else {
						if (0 === cmd[0]) 									// signed argument
							prefix = "泥" == code[offset++] && -1 || 1;
						else
							prefix = 1; 									// unsigned argument
						tree.push(cmd[1]);
						args[count] = prefix * parseInt(lexer(code, 1).join(''), 2); 

						if (1 === cmd[0]) { 								// define label
							marks[args[count]] = count; 
							near = count; 
						} 
					}
				}
				//trace[count] = [count+1, cache.join(''), args[count], tree[count]];
				//console.info("log 1:", trace[count])
				cache = [];
				count++;
			} else {
				if ("草" == token)
					tree.push(0);
				else if ("泥" == token)
					tree.push(1);
				else if ("马" == token)
					break;
			}
			if (+new Date - timer > 1000)
				throw new Error("We must stop Grass Mud Horse because it have run too long..");
		}

		return tree;
	}

	// runtime
	function call(process){
		var timer = +new Date();
		count = 0;
		var l = process.length;
		while (count < l) {
			//console.info("log 2:", trace[count], stack.toString())
			count = process[count](args[count]) || count;
			count++;
			if (+new Date - timer > 1000)
				throw new Error("We must stop Grass Mud Horse because it have run too long..");
		}
	}

	var interpreter = {
		type: "GrassMudHorse",
		debugEnable: false,
		print: null, // interface
		reset: null, // interface
		eval: function(code){
			try{

				if (this.type == "Whitespace")
					code = code.replace(/\s/g, function(char){
						return char === " " && "草" || char === "\t" && "泥" || char === "\n" && "马";
					});

				var tree = lexer(code);
				call(tree);
				put('[SUCCESS]');

			} catch(ex) {
				put('\n');
				if ("exit" == ex.message)
					put('[SUCCESS]');
				else
					put('[ERROR] ' + ex.message);
			}	
			// reset
			stack = [];
			heap = {};
			marks = {};
			near = 0;
			count = 0;
			offset = 0;
		}
	};

	return interpreter;
})();

