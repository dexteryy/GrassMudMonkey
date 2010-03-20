var interpreter = (function(){
	var stack = [],
		heap = {},
		marks = {},
		trace = {},
		top = 0,		// location of caller
		o = 0,			// location
		line = 1; 		// line number or command count

	var valid = { "草": 1, "泥": 1, "马": 1 };

	var table = {
		// Stack Manipulation
		"草草": [0, function(num){ stack.push(num); }], 											// push, signed
		"草马草": [function(){ stack.push(stack[stack.length-1]); }], 								// dup,
		"草马泥": [function(){ stack.splice(-1, 0, stack.pop()); }], 								// swap
		"草马马": [function(){ stack.pop(); }],														// discard
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
		"马草草": [, function(label){ marks[label] = o; }],											// label, unsigned
		"马草泥": [, function(label){ top = o; jump(label); }], 									// call, unsigned
		"马草马": [, function(label){ jump(label); }], 												// jump, unsigned
		"马泥草": [, function(label){ if (0 == stack.pop()) jump(label); }], 						// jz, unsigned
		"马泥泥": [, function(label){ if (0 > stack.pop()) jump(label); }], 						// jn, unsigned
		"马泥马": [function(){ o = top; line = trace[o][0]; }], 									// ret
		"马马马": [function(){ throw new Error("exit"); }], 										// exit
		// IO
		"泥马草草": [function(){ var r = stack.pop(); put(r == 10 && '\n' || r); }], 				// outchar
		"泥马草泥": [function(){ put(stack.pop()); }], 												// outnum
		"泥马泥草": [function(){ heap[stack.pop()] = getInput(); }], 								// readchar
		"泥马泥泥": [function(){ heap[stack.pop()] = parseInt(getInput()); }] 						// readnum
	};

	function jump(label){
		o = marks[label];
		line = trace[o][0]; 
	}

	function put(src){
		var result = src;
		if (window.console)
			window.console.info(result);
		if (interpreter.print)
			interpreter.print(src);
		else
			alert(result);
	}

	function getInput(){}

	function mainloop(code, path){
		var token,
			cmd,
			cache = [],
			timer = +new Date();

		while (token = code[o++]) {
			if (!valid[token])
				continue;
			if (!path) {
				cache.push(token);
				cmd = cache.join('');
				if (!table[cmd]) {
					continue;
				} else {
					if (table[cmd][0]) {
						console.info(line, cmd, table[cmd], stack.toString())
						table[cmd][0]();
						console.info(line, cmd, table[cmd], stack.toString())
					} else {
						console.info(line, cmd, table[cmd], stack.toString())
						if (table[cmd][0] === 0)
							prefix = "泥" == code[o++] && -1 || 1; // @TODO
						else
							prefix = 1;
						table[cmd][1](prefix * parseInt(arguments.callee(code, 1), 2));
						console.info(line, cmd, table[cmd], stack.toString())
					}
				}
				cache = [];
				trace[o] = [++line];
			} else {
				if ("草" == token)
					cache.push(0);
				else if ("泥" == token)
					cache.push(1);
				else if ("马" == token)
					break;
			}
			if (+new Date - timer > 1000)
				throw new Error("We must stop Grass Mud Horse because it have run too long..");
		}

		return cache.join('');
	}

	var interpreter = {
		eval: function(code){
			try{
				mainloop(code);
			} catch(ex) {
				put('\n');
				if ("exit" == ex)
					put('[COMPLETED]');
				else
					put('[ERROR] ' + ex.message);
			}	
			stack = [];
			heap = {};
			marks = {};
			top = 0;
			o = 0;
			line = 1;
		}
	};

	return interpreter;
})();

