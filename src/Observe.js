class Watcher {
    constructor(expr, vm, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb
        this.oldValue = this.getOldVal()
    }
    getOldVal() {
        Dep.target = this
        const oldValue = compileUtil.getVal(this.expr, this.vm)
        Dep.target = null
        // console.log(oldValue,'初始化')
        return oldValue
    }
    //更新
    update() {
        const newVal = compileUtil.getVal(this.expr, this.vm)
        // console.log(newVal,'更新')
        this.cb(newVal)
    }
}


class Dep {
    constructor() {
        this.subs = [] //存储watcher
    }
    addSub(watcher) {
        this.subs.push(watcher)
    }
    notify() {
        // console.log(this.subs)
        this.subs.forEach(w => w.update())
    }
}

class Observe {
    constructor(data, vm) {
        this.vm = vm
        this.data = data
        this.observe(data)
    }
    observe(data) {
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key])
            })
        }

    }
    defineReactive(obj, key, value) {
        this.observe(value)
        const dep = new Dep()
        Object.defineProperty(obj, key, {
            configurable: false,
            enumerable: true,
            get: () => {
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set: (newVal) => {
                this.observe(newVal)
                if (value !== newVal) {
                    value = newVal
                }
                dep.notify()
            }
        })
    }
}