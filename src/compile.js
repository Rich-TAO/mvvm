const compileUtil = {
    getVal(expr, vm) {
        // console.log(expr,vm.$data)
        const exprArr = expr.split('.')
        return exprArr.reduce((data, currentVal) => {
            return data[currentVal]
        }, vm.$data)
    },
    setVal(expr,vm,inputVal){
        const exprArr = expr.split('.')
        return exprArr.reduce((data, currentVal) => {
             data[currentVal] = inputVal
        }, vm.$data)
    },
    getContent(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...arg) => {

            return this.getVal(arg[1].trim(), vm)
        })
    },
    text(node, expr, vm) {
        // console.log(node,expr,vm.$data)
        let value
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...arg) => {
                new Watcher(arg[1].trim(), vm, (newVal) => {
                    this.updater.textUpdate(node, this.getContent(expr, vm))
                })
                return this.getVal(arg[1].trim(), vm)
            })
        } else {
            value = this.getVal(expr, vm)
            new Watcher(expr, vm, (newVal) => {
                this.updater.textUpdate(node, newVal)
            })
        }

        this.updater.textUpdate(node, value)

    },
    html(node, expr, vm) {
        const value = this.getVal(expr, vm)
        new Watcher(expr, vm, (newVal) => {
            this.updater.htmlUpdate(node, newVal)
        })
        this.updater.htmlUpdate(node, value)
    },
    model(node, expr, vm) {
        const value = this.getVal(expr, vm)
        new Watcher(expr, vm, (newVal) => {
            this.updater.modelUpdate(node, newVal)
        })
        this.updater.modelUpdate(node, value)

        node.addEventListener('input', (e) => {
            this.setVal(expr, vm, e.target.value)
        })
    },
    bind(node, expr, vm, attrName) {
        console.log(node, expr, vm, attrName)
    },
    on(node, expr, vm, eventName) {
        if (!vm.$options.methods[expr]) {
            throw new Error(expr + 'not a defined')
        }
        let fn = vm.$options.methods[expr].bind(vm)
        node.addEventListener(eventName, fn)
    },
    updater: {
        textUpdate(node, value) {
            node.textContent = value
        },
        htmlUpdate(node, value) {
            node.innerHTML = value
        },
        modelUpdate(node, value) {
            node.value = value
        },
    }
}

class Compile {
    constructor(el, vm) {
        this.vm = vm
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        //1.获取文档碎片
        this.fragment = this.node2Fragment(this.el)
        //2.编译文档碎片
        this.compile(this.fragment)
        //3. 还原到dom
        this.fragment2Element(this.fragment)
    }
    compile(fragment) {
        const childNodes = fragment.childNodes
        Array.from(childNodes).forEach(child => {
            // console.log(child)
            if (this.isElementNode(child)) {
                //编译元素节点

                this.compileElement(child)
            } else {
                //编译文本节点
                this.compileText(child)
            }

            if (child.childNodes && child.childNodes.length) {
                this.compile(child)
            }
        })
    }
    compileElement(node) {
        const attrs = node.attributes
        Array.from(attrs).forEach(attr => {
            const {
                name,
                value
            } = attr
            if (this.isDirective(name)) {
                // console.log(name, value) // v-text v-on:click
                const [, directive] = name.split('-') // text on:click 
                const [dirName, eventName] = directive.split(':')
                //数据驱动视图
                compileUtil[dirName](node, value, this.vm, eventName)
                //删除自定义属性
                node.removeAttribute('v-' + directive)
            }
            if (name.startsWith('@')) {
                const [, eventName] = name.split('@')
                compileUtil['on'](node, value, this.vm, eventName)
            }
            if (name.startsWith(':')) {
                const [, attrName] = name.split(':')
                compileUtil['bind'](node, value, this.vm, attrName)
            }

        })
    }
    compileText(node) {
        const content = node.textContent
        // console.log(content)
        if (/\{\{(.+?)\}\}/.test(content)) {
            // console.log(content)
            compileUtil['text'](node, content, this.vm)
        }
    }
    fragment2Element(fragment) {
        this.el.appendChild(fragment)
    }
    node2Fragment(el) {
        const f = document.createDocumentFragment()
        let firstChild
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }
    isElementNode(node) {
        return node.nodeType === 1
    }
    isDirective(name) {
        return name.startsWith('v-')
    }
}