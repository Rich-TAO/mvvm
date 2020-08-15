class Vue {
    constructor(options) {
        this.$el = options.el
        this.$data = typeof options.data === 'function' ? options.data.call(this) : options.data
        this.$options = options
        // 代理
        this.proxyData(this,this.$data)
        //数据劫持
        if (this.$data) {
            new Observe(this.$data, this)
        }
        //编译视图
        if (this.$el) {
            new Compile(this.$el, this)
        }
    }
    proxyData(vm,data){
        Object.keys(data).forEach(key=>{
            Object.defineProperty(vm,key,{
                get(){
                    return data[key]
                },
                set(newVal){
                    data[key] = newVal
                }
            })
        })
    }
}