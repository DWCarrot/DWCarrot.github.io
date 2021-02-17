
var CB = (function() {
	
	class Util {
	
		constructor() {
			
		}
		
		static parseJSObject(s) {
			let f = new Function('return ' + s);
			return f();
		}
		
		static stringifyJSObject(obj, exclude) {
			let s = '{';
			for(let prop in obj) {
				if(exclude && exclude.includes(prop))
					continue;
				if(s.length > 1)
					s += ',';
				s += (prop + ':');
				let value = obj[prop];
				if(typeof value == 'string')
					s += value;
				else
					s += this.stringifyJSObject(value);
			}
			s += '}';
			return s;
		}
	}
	
	class ParseException {
		
		constructor(node, reader) {
			this.name = 'ParseException';
			this.node = node;
			this.reader = reader;
		}
	}
	
	class StringReader {
		
		constructor(s, start, end) {
			this.value = s || '';
			this.start = start || 0;
			this.end = end || s.length;
			this.index = 0;
		}
		
		index(index) {
			this.index = index || 0;
		}
		
		skip(len) {
			len = len || 1;
			this.index += len;
		}
		
		readable() {
			return this.end - (this.index + this.start);
		}
		
		get() {
			return this.value[this.index + this.start] || '';
		} 
		
		read(len) {
			len = len || 1;
			let start = this.start + this.index;
			let end = start + len;
			if(end > this.end)
				end = this.end;
			this.index += len;
			return this.value.slice(start, end);
		}
		
		readBlock(match, skip) {
			if(skip) {
				while(skip.test(this.value[this.start + this.index]))
					++this.index;
			}
			for(let i = this.start + this.index; i < this.end; ++i) {
				if(!match.test(this.value[i])) {
					let c = this.start + this.index;
					this.index = i - this.start;
					return this.value.slice(c, i);
				}
			}
			let c = this.start + this.index;
			this.index = this.end - this.start;
			return this.value.slice(c, this.end);
		}
		
		readRaw() {
			let i = this.start + this.index;
			if(this.value[i] != '"' || (i > 0 && this.value[i-1] == '\\'))
				return '';
			for(i = this.start + this.index + 1; i < this.end; ++i) {
				if(this.value[i] == '"' && this.value[i-1] != '\\') {
					let c = this.start + this.index;
					this.index = i + 1 - this.start;
					return this.value.slice(c, i + 1);
				}
			}
			throw new ParseException(null, this);
		}
	}
	
	class Node {
		
		constructor() {
			
		}
		
		parse() {
			
		}
		
		stringify() {
			
		}
	}
	
	class ValueNode extends Node {
		
		constructor() {
			super();
		}
		
		parse(reader) {
			if(reader.get() == '"') {
				this.value = JSON.parse(reader.readRaw());
				try {
					this.value = JSON.parse(this.value);
					this.type = 'json';
				} catch(e) {
					if(e instanceof SyntaxError)
						this.type = 'string';
					else
						throw e;
				}
			} else {
				this.value = reader.readBlock(/[0-9a-z\+\-]/, /\s/);
			}
			return this;
		}
		
		stringify() {
			
		}
	}
	
	class NBTNode extends Node {
		
		constructor() {
			super();
		}
		
		parse(reader) {
			if(reader.get() == '{') {
				this.obj = {};
				while(reader.readable() > 0 && reader.read() != '}') {
					let prop = reader.readBlock(/[A-Za-z0-9_\-]/, /\s/);
					if(prop != '' && reader.read() != ':')
						throw new ParseException(this, reader);
					let value = reader.get();
					if(value == '[' || value == '{')
						value = new NBTNode().parse(reader);
					else
						value = new ValueNode().parse(reader);
					if(prop == '')
						prop = '$';
					this.obj[prop] = value;
				}
				return this;
			}
			if(reader.get() == '[') {
				this.obj = [];
				while(reader.readable() > 0 && reader.read() != ']') {
					let value = reader.get();
					if(value == '[' || value == '{')
						value = new NBTNode().parse(reader);
					else
						value = new ValueNode().parse(reader);
					this.obj.push(value);
				}
				return this;
			}
		}
		
		stringify() {
			
		}
	}
	
	class ArgumentNode extends Node {
		
		constructor() {
			super();
		}
		
		parse(reader) {
			let block = reader.readBlock(/[~0-9A-Za-z\-_:@]/, /\s/);
			if(block != '')
				this.item = block;
			if(reader.readable() > 0 && reader.get() == '{')
				this.nbt = new NBTNode().parse(reader);
			if(!('item' in this || 'nbt' in this))
				throw new ParseException(this, reader);
			return this;
		}
		
		stringify() {
			
		}
	}
	
	class CommandNode extends Node {
		
		constructor() {
			super();
		}
		
		parse(reader) {
			let block = reader.readBlock(/[/0-9A-Za-z\-_:]/, /\s/);
			if(block == '')
				throw new ParseException(this, reader);
			this.cmd = block.slice(block[0] == '/' ? 1 : 0, block.length);
			this.args = [];
			while(reader.readable() > 0) {
				this.args.push(new ArgumentNode().parse(reader));
			}
			return this;
		}
		
		stringify() {
			
		}
	}
	
	
	return {Util, StringReader, NBTNode, ArgumentNode, CommandNode};
	
})();



