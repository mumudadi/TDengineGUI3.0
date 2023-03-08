const TaosRestful = require('./taosrestful_.js')
const storage = require('./localDataStore.js')
const { TouchBarScrubber } = require('electron')

new Vue({
    el: '#app',
    mounted: function () {
      let links = storage.getLinks()
      for(let i = 0,len=links.length; i < len; i++) {
        let payload = {
          ip:links[i].host,
          port:links[i].port,
          user:links[i].user,
          password:links[i].password
        }
        TaosRestful.getVersion(payload).then(data => {
          links[i].version = data
          this.$data.links =links
        })
      }

    },
    data: function() {
      return {
        dbInfo:'',
        consoleResult:'',
        loadingLinks: false,
        drawer: true,
        addLinkDialog: false,
        linkForm: {
          name:"",
          host:"",
          port:"",
          user:"",
          password:"",
        },
        activeTab:"1",

        surperTableFilterCopy:{},

        surperTableFilter:{
          fields:[],
          surperDateRange:[],
          surperTSearchText: "",
          surperTSearchColumn: "",
        },

        tableFilterCopy:{},
        tableFilter:{
          fields:[],
          dateRange:[],
          tableSearchText:"",
          tableSearchColumn:"",
        },
        surperWhere:"",
        tableWhere:"",

        tableFilterDialog:false,
        surperTableFilterDialog:false,

        surperTables: [], //超级表list
        surperTableData: [],
        surperTableName: "",
        totalSurperTable: 0,
        surperTableLabelItems: [],
        surperTableLabel: [],
        dataType: [],
        loadingSurperList: false,
        loadingSurperTable: false,
        //sql语句查询表数据
        sqlTableData: [],

        tables: [], //表list
        tableData: [],
        tableName: "",
        totalTable: 0,
        tableLabelItems: [],
        tableLabel: [],
        loadingTableList: false,
        loadingTable: false,

        eachPageSurperTable:10,
        currentPageSurperTable:1,
        eachPageTable:10,
        currentPageTable:1,

        addDBDialogLinkKey:0,
        addDBDialog:false,
        addDBname:"",
        addDBOptions: {
          BUFFER : 96,
          CACHEMODEL  :"'none'",
          CACHESIZE  :"",
          COMP :"2",
          DURATION  :"",
          WAL_FSYNC_PERIOD :3000,
          MAXROWS :4096,
          MINROWS :100,
          KEEP :"",
          PAGES:256,
          PAGESIZE  :4,
          PRECISION :"'ms'",
          REPLICA :"1",
          RETENTIONS :"",
          WAL_LEVEL:"1",
          VGROUPS :"",
          SINGLE_STABLE :"",
          STT_TRIGGER :1,
          TABLE_PREFIX :"",
          TABLE_SUFFIX :"",
          TSDB_PAGESIZE :4,
          WAL_RETENTION_PERIOD:"",
          WAL_ROLL_PERIOD :"",
          WAL_RETENTION_SIZE :"",
          WAL_SEGMENT_SIZE :"",
        },


        searchIcon: true,
        freshIcon: true,
        links:[],
        theLink:{}, //当前连接
        theDB: "", //当前数据库

        SuperTdialog: false,
        SuperTdialogText: "",
        Tdialog: false,
        TdialogText: "",

        surperTorder:"ASC",
        Torder:"ASC",
        consoleInput: "",
        marks: {
          0: '0',
          365: '365',
          36500: '36500'
        },
        //SQL页面tab默认值
        sqlActiveName: '1',
        //SQL页面表格字段
        sqlDataType: [],
      }
    },
    methods: {
      beforeClosedrawer(){
        if(this.theDB){
          this.drawer = false
        } else {
          this.$message({
            message: '请选择数据库',
            type: 'warning',
            duration:1000
          });
        }
      },
      cancelAddLink() {
        this.addLinkDialog = false
        //清空表单
        this.linkForm={
          name:"",
          host:"",
          port:"",
          user:"",
          password:""
        }
      },
      confirmAddLink(event) {
        //新建连接，先连接，如果成功，将payload+name记入本地
        //var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")
        let payload = {
          ip:this.linkForm.host,
          port:this.linkForm.port,
          user:this.linkForm.user,
          password:this.linkForm.password
        }
        TaosRestful.showDatabases(payload).then(data =>{
            //处理返回的数据库数据
            if(data.data){

              TaosRestful.getVersion(payload).then(_data => {
                //连接成功，保存到本地
                storage.AddALink({
                  name: this.linkForm.name,
                  host: this.linkForm.host,
                  port: this.linkForm.port,
                  user: this.linkForm.user,
                  password: this.linkForm.password,
                  version: _data
                })
                //关闭新建连接的弹窗
                this.addLinkDialog = false
                //清空表单
                this.linkForm={
                  name:"",
                  host:"",
                  port:"",
                  user:"",
                  password:"",
                }

                //更新连接列表
                this.links = storage.getLinks()
              })

            } else {
              //连接失败
              this.$message({
                message: '连接失败',
                type: 'error',
                duration:1000
              });
            }

        }
        )

      },
      deleteLink(key, linkName){
        this.$confirm('确认删除连接' + linkName + "吗？")
        .then(_ => {
          storage.deleteALink(key)
          this.links = storage.getLinks()
          this.$message({
            message: '删除成功',
            type: 'success',
            duration:500
          });
        })
        .catch(_ => {
          this.$message({
            message: '操作已取消',
            type: 'warning',
            duration:500
          });
        });
      },
      freshDB(key){
        let theLink = this.links[key]
        let payload = {
          ip:theLink.host,
          port:theLink.port,
          user:theLink.user,
          password:theLink.password
        }
        this.loadingLinks = true
        TaosRestful.showDatabases(payload).then(data =>{
          this.loadingLinks = false
          if(data.data){
            this.$message({
              message: '刷新成功',
              type: 'success',
              duration:1000
            });
            this.links[key].dbs = data.data
            //TODO展开菜单

          } else {
            //连接失败，1.提示 2.删除当前连接 3.重新连接
            //1
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
            //2
            storage.deleteALink(key)
            this.links = storage.getLinks()
            //3
            this.$message({
              message: '尝试重新连接',
              type: 'warning',
              duration:1000
            });
            this.linkForm = {
              name: theLink.name,
              host: theLink.host,
              port: theLink.port,
              user: theLink.user,
              password: theLink.password,
            }
            this.addLinkDialog = true
          }
        })
      },
      addDB(key){
        this.addDBDialogLinkKey = key
        this.addDBDialog = true
      },
      postaddDB(){
        let key = this.addDBDialogLinkKey
        let theLink = this.links[key]
        let payload = {
          ip:theLink.host,
          port:theLink.port,
          user:theLink.user,
          password:theLink.password
        }
        if(this.addDBname){
          TaosRestful.createDatabase(this.addDBname, payload,safe=true,this.addDBOptions).then(data => {
            if(data.data){
              //新增成功
              this.$message({
                message: '添加成功',
                type: 'success',
                duration:1000
              });
              this.freshDB(key)
              this.addDBDialog = false
            }else{
              //添加失败
              this.$message({
                message: data.msg,
                type: 'error',
                duration:1000
              });
            }
          })
        } else{
          this.$message({
            message: '请填写内容',
            type: 'warning',
            duration:1000
          });
        }
      },
      deleteDB(link, dbName, key){
        this.$confirm('确认删除数据库' + dbName + "吗？")
        .then(_ => {
          let payload = {
            ip:link.host,
            port:link.port,
            user:link.user,
            password:link.password
          }
          this.loadingLinks = true

          TaosRestful.dropDatabase(dbName, payload).then(data => {

            if(data.data){
              //成功
              this.$message({
                message: '删除成功',
                type: 'success',
                duration:1000
              });
            } else {
              this.$message({
                message: data.msg,
                type: 'error',
                duration:1000
              });
            }
            this.loadingLinks = false
            this.freshDB(key)
          })
        })
        .catch(_ => {
          this.$message({
            message: '操作已取消',
            type: 'warning',
            duration:1000
          });
        });
      },
      makeDbInfo(data,dbName){
        let info = '无法获取数据库信息'
          if(data && data.res){
            let dataInfo = data.data[0];
            info = `数据库名:&nbsp;&nbsp;${dbName}<br/>`
            info += `创建时间:&nbsp;&nbsp;${dataInfo.create_time}<br/>`
            info += `buffer:&nbsp;&nbsp;${dataInfo.buffer}<br/>`
            info += `cachemodel:&nbsp;&nbsp;${dataInfo.cachemodel}<br/>`
            info += `cachesize:&nbsp;&nbsp;${dataInfo.cachesize}<br/>`
            info += `comp:&nbsp;&nbsp;${dataInfo.comp}<br/>`
            info += `duration:&nbsp;&nbsp;${dataInfo.duration}<br/>`
            info += `keep:&nbsp;&nbsp;${dataInfo.keep}<br/>`
            info += `maxrows:&nbsp;&nbsp;${dataInfo.maxrows}<br/>`
            info += `minrows:&nbsp;&nbsp;${dataInfo.minrows}<br/>`
            info += `ntables:&nbsp;&nbsp;${dataInfo.ntables}<br/>`
            info += `pages:&nbsp;&nbsp;${dataInfo.pages}<br/>`
            info += `pagesize:&nbsp;&nbsp;${dataInfo.pagesize}<br/>`
            info += `precision:&nbsp;&nbsp;${dataInfo.precision}<br/>`
            info += `replica:&nbsp;&nbsp;${dataInfo.replica}<br/>`
            info += `retentions:&nbsp;&nbsp;${dataInfo.retentions}<br/>`
            info += `single_stable:&nbsp;&nbsp;${dataInfo.single_stable}<br/>`
            info += `status:&nbsp;&nbsp;${dataInfo.status}<br/>`
            info += `strict:&nbsp;&nbsp;${dataInfo.strict}<br/>`
            info += `stt_trigger:&nbsp;&nbsp;${dataInfo.stt_trigger}<br/>`
            info += `table_prefix:&nbsp;&nbsp;${dataInfo.table_prefix}<br/>`
            info += `table_suffix:&nbsp;&nbsp;${dataInfo.table_suffix}<br/>`
            info += `tsdb_pagesize:&nbsp;&nbsp;${dataInfo.tsdb_pagesize}<br/>`
            info += `vgroups:&nbsp;&nbsp;${dataInfo.vgroups}<br/>`
            info += `wal_fsync_period:&nbsp;&nbsp;${dataInfo.wal_fsync_period}<br/>`
            info += `wal_level:&nbsp;&nbsp;${dataInfo.wal_level}<br/>`
            info += `wal_retention_period:&nbsp;&nbsp;${dataInfo.wal_retention_period}<br/>`
            info += `wal_retention_size:&nbsp;&nbsp;${dataInfo.wal_retention_size}<br/>`
            info += `wal_roll_period:&nbsp;&nbsp;${dataInfo.wal_roll_period}<br/>`
            info += `wal_segment_size:&nbsp;&nbsp;${dataInfo.wal_segment_size}<br/>`
          }

        return info
      },
      alartDB(link,dbName){
        //查看数据库参数
        let payload = {
          ip:link.host,
          port:link.port,
          user:link.user,
          password:link.password
        }
        TaosRestful.showDatabaseInfo(dbName,payload).then(data =>{
          this.dbInfo=this.makeDbInfo(data,dbName)
        });
        //切换数据库前先清空表
        this.surperTables = []
        this.clearSurperTable()
        this.tables = []
        this.clearTable()

        //记录进入的数据库
        this.theLink = link
        this.theDB = dbName

        //更新超级表页
        this.drawer = false
        this.activeTab = "1"
        this.freshSurperTables()
      },
      searchSurperTList(){
        this.SuperTdialog = false
        this.surperTables = []
        this.clearSurperTable()
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingSurperList = true
        TaosRestful.showSuperTables(this.theDB, payload, like=this.SuperTdialogText).then(data =>{
          if(data.data){
            //拉取超级表成功
            this.$message({
              message: '查找成功',
              type: 'success',
              duration:1000
            });
            this.surperTables = data.data
          } else {
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
            this.freshSurperTables()
          }
          this.SuperTdialogText = ""
          this.loadingSurperList = false
        })

      },
      freshSurperTList(){
        this.surperTables = []
        this.clearSurperTable()
        this.freshSurperTables()
      },
      searchTList(){
        this.Tdialog = false
        this.tables = []
        this.clearTable()

        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingTableList = true
        TaosRestful.showTables(this.theDB, payload, like=this.TdialogText).then(data =>{
          if(data.data){
            //拉取表成功
            this.$message({
              message: '查找成功',
              type: 'success',
              duration:1000
            });
            this.tables = data.data
          }else{
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
            this.freshTables()

          }
          this.TdialogText = ""
          this.loadingTableList = false
        })
      },
      freshTList(){
        this.tables = []
        this.clearTable()
        this.freshTables()
      },
      clearSurperTable(){
        this.surperTableName = ""
        this.totalSurperTable = 0
        this.surperTableData = []
        this.surperTableLabel = []
        this.surperTableFilter={
          fields:[],
          surperDateRange:[],
          surperTSearchText: "",
          surperTSearchColumn: "",
        }
      },
      clearTable(){
        this.tableName = ""
        this.totalTable = 0
        this.tableData = []
        this.tableLabel = []
        this.tableFilter={
          fields:[],
          dateRange:[],
          tableSearchText:"",
          tableSearchColumn:"",
        }
      },
      freshSurperTables(){
        //清理超级表列表
        this.surperTables = []
        //清理选中的超级表和具体数据
        this.clearSurperTable()

        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingSurperList = true
        TaosRestful.showSuperTables(this.theDB, payload).then(data =>{
          if(data.data){
            //拉取超级表成功
            this.$message({
              message: '刷新成功',
              type: 'success',
              duration:1000
            });
            this.surperTables = data.data
          } else {
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
          }
          this.loadingSurperList = false
        })
      },
      freshTables(){
        //清理表列表
        this.tables = []
        //清理选中的表和具体数据
        this.clearTable()

        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingTableList = true
        TaosRestful.showTables(this.theDB, payload).then(data =>{
          if(data.data){
            //拉取表成功
            this.$message({
              message: '刷新成功',
              type: 'success',
              duration:1000
            });
            this.tables = data.data
          }else{
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
          }
          this.loadingTableList = false
        })
      },
      handleSwichTab(tab) {
        switch(tab.name) {
          case "1":
            //超级表
            this.freshSurperTables()
            break;
          case "2":
            //表
            this.freshTables()
            break;
          case "3":
            //控制台
            break;
          case "4":
            //数据库属性
            break;
     }
      },
      openSurperTableFilterD(){
        this.surperTableFilterDialog = true
        this.surperTableFilterCopy = JSON.parse(JSON.stringify(this.surperTableFilter))
      },
      concelSurperTableFilter(){
        this.$message({
          message: '取消操作',
          type: 'warning',
          duration:1000
        });
        this.surperTableFilterDialog = false
        this.surperTableFilter = this.surperTableFilterCopy
      },
      postSurperTableFilter(){
        this.surperTableFilterDialog = false
        this.selectSurperData(false)
      },
      openTableFilterD(){
        this.tableFilterDialog = true
        this.tableFilterCopy = JSON.parse(JSON.stringify(this.tableFilter))
      },
      concelTableFilter(){
        this.$message({
          message: '取消操作',
          type: 'warning',
          duration:1000
        });
        this.tableFilterDialog = false
        this.tableFilter = this.tableFilterCopy
      },
      postTableFilter(){
        this.tableFilterDialog = false
        this.selectTData(false)
      },
      searchSurperText(){
        if(this.surperTableFilter.surperTSearchColumn && this.surperTableFilter.surperTSearchText.trim()){
          // this.surperWhere = this.surperTSearchColumn + " > " + this.surperTSearchText.trim()+"%"
          // this.clearSurperTable()
          let surperTSearchText = this.surperTableFilter.surperTSearchText.trim()
          if(!isNaN(surperTSearchText)){
            this.surperWhere =this.surperTableFilter.surperTSearchColumn + " = " + surperTSearchText
          } else {
            this.surperWhere =this.surperTableFilter.surperTSearchColumn + " = '" + surperTSearchText +"'"
          }

          this.selectSurperData(false)
        } else {
          this.surperWhere = ""
          this.$message({
            message: '请填写正确',
            type: 'warning',
            duration:1000
          });
          this.selectSurperData(false)
        }
      },
      searchTableText(){
        if(this.tableFilter.tableSearchColumn && this.tableFilter.tableSearchText.trim()){

          let tableSearchText = this.tableFilter.tableSearchText.trim()
          if(!isNaN(tableSearchText)){
            this.tableWhere =this.tableFilter.tableSearchColumn + " = " + tableSearchText
          } else {
            this.tableWhere =this.tableFilter.tableSearchColumn + " = '" + tableSearchText +"'"
          }

          this.selectTData(false)
        } else {
          this.tableWhere = ""
          this.$message({
            message: '请填写正确',
            type: 'warning',
            duration:1000
          });
          this.selectTData(false)
        }
      },
      selectSurperData(isFirst, isResetPage){

        //处理时间范围
        let startTime = null
        let endTime = null
        if(this.surperTableFilter.surperDateRange){
          startTime = this.surperTableFilter.surperDateRange[0];
          endTime = this.surperTableFilter.surperDateRange[1];
        }

        //是否需要重置分页
        if(isResetPage){
          this.currentPageSurperTable = 1
        }

        let offsetVal = (this.currentPageSurperTable-1)*this.eachPageSurperTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingSurperTable = true

        //处理查询数据
        // if(!this.surperTableFilter.surperTSearchText.trim()){
        //   this.surperWhere = ""
        // }

        //tableName,dbName,payload,fields=null,where=null,limit =null,offset = null,desc =null,startTime=null,endTime=null

        console.log(this.surperTableFilter.fields)


        TaosRestful.selectData(this.surperTableName, this.theDB, payload, fields=this.surperTableFilter.fields, where=this.surperWhere
          , limit=this.eachPageSurperTable, offset=offsetVal, desc=this.surperTorder, startTime=startTime, endTime=endTime)
        .then(data =>{
          if(data.data){
            //成功
            if(data.data.length != 0){
              //有数据
              this.$message({
                message: '获取成功',
                type: 'success',
                duration:1000
              });
              if(isFirst){
                this.surperTableLabelItems = Object.keys(data.data[0])
              }
              this.surperTableLabel = Object.keys(data.data[0])
              this.dataType = data.dataType;
              this.surperTableFilter.fields =  Object.keys(data.data[0])
              this.surperTableData = data.data
              this.surperTableData.unshift(data.dataType)
              this.totalSurperTable = data.count
            } else {
              this.surperTableLabel = []
              this.surperTableData = data.data
              this.totalSurperTable = data.count
              this.$message({
                message: '无数据',
                type: 'warning',
                duration:1000
              });
            }
          }else{
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
          }
          this.loadingSurperTable = false

        })
      },
      selectTData(isFirst, isResetPage=false){

        //处理时间范围
        let startTime = null
        let endTime = null
        if(this.tableFilter.dateRange){
          startTime = this.tableFilter.dateRange[0];
          endTime = this.tableFilter.dateRange[1];
        }

        if(isResetPage){
          this.currentPageTable = 1
        }

        let offsetVal = (this.currentPageTable-1)*this.eachPageTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingTable = true

        // if(!this.tableFilter.tableSearchText.trim()){
        //   this.tableWhere = ""
        // }
        //tableName,dbName,payload,fields=null,where=null,limit =null,offset = null,desc =null,startTime=null,endTime=null
        TaosRestful.selectData(this.tableName, this.theDB, payload, fields=this.tableFilter.fields, where=this.tableWhere
          , limit=this.eachPageTable, offset=offsetVal, desc=this.Torder, startTime=startTime, endTime=endTime)
        .then(data =>{
          if(data.data){
            //成功
            if(data.data.length != 0){
              //有数据
              this.$message({
                message: '获取成功',
                type: 'success',
                duration:1000
              });
              if(isFirst){
                this.tableLabelItems = Object.keys(data.data[0])
              }
              this.tableLabel = Object.keys(data.data[0])
              this.tableFilter.fields =  Object.keys(data.data[0])
              this.tableData = data.data
              this.totalTable = data.count
            } else {
              this.tableLabel = []
              this.tableData = data.data
              this.totalTable = data.count
              this.$message({
                message: '无数据',
                type: 'warning',
                duration:1000
              });
            }
          }
          this.loadingTable = false
        })
      },
      surTableFilter(){
        this.selectSurperData(0)
      },
      handleClickSurperT(val) {
        if(val){
          this.clearSurperTable()
          this.surperTableName = val.stable_name
          this.selectSurperData(true)
        }
      },
      handleClickT(val) {
        if(val){
          this.clearTable()
          this.tableName = val.table_name
          this.selectTData(true)
        }
      },
      paginationSurperChange(){
        this.selectSurperData(false)
      },
      paginationChange(){
        this.selectTData(false)
      },
      editSurperT(val) {
        console.log(val)
      },
      deleteSurperT(val) {
        this.$confirm('确认删除超级表' + val + "吗？")
        .then(_ => {
          let payload = {
            ip:this.theLink.host,
            port:this.theLink.port,
            user:this.theLink.user,
            password:this.theLink.password
          }
          this.loadingSurperList = true

          //TODO没测试过
          TaosRestful.dropTable(val, this.theDB, payload).then(data => {

            if(data.data){
              //成功
              this.$message({
                message: '删除成功',
                type: 'success',
                duration:500
              });
            } else {
              this.$message({
                message: data.msg,
                type: 'error',
                duration:500
              });
            }
            this.loadingSurperList = false
            this.freshSurperTables()
          })

        })
        .catch(_ => {
          this.$message({
            message: '操作已取消',
            type: 'warning',
            duration:500
          });
        });
      },
      editT(val) {
        console.log(val)
      },
      deleteT(val) {
        this.$confirm('确认删除表' + val + "吗？")
        .then(_ => {
          let payload = {
            ip:this.theLink.host,
            port:this.theLink.port,
            user:this.theLink.user,
            password:this.theLink.password
          }
          this.loadingTableList = true

          //TODO没测试过
          TaosRestful.dropTable(val, this.theDB, payload).then(data => {

            if(data.data){
              //成功
              this.$message({
                message: '删除成功',
                type: 'success',
                duration:500
              });
            } else {
              this.$message({
                message: data.msg,
                type: 'error',
                duration:500
              });
            }
            this.loadingTableList = false
            this.freshTables()
          })

        })
        .catch(_ => {
          this.$message({
            message: '操作已取消',
            type: 'warning',
            duration:500
          });
        });
      },
      async sendSQL(){
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        // console.log(this.theDB)
        //判断是否是count语句
        let countSql = ''
        if(this.consoleInput.toLowerCase().indexOf(' count(') == -1
            && this.consoleInput.toLowerCase().indexOf(' limit ') == -1
            && this.consoleInput.toLowerCase().indexOf(' group ') == -1) {
          //先查询count语句，防止查询的数据较多导致软件崩溃
          countSql = "select count(*) " + this.consoleInput.substring(this.consoleInput.toLowerCase().indexOf(' from '))
        }
        console.log('countSql:' + countSql)
        if(countSql != '') {
          //最大查询条数
          let maxNum = 200
          let isQuery = true
          //查询总条数
          await TaosRestful.rawSqlWithDB(countSql,this.theDB,payload).then(data => {
            if(data.data && data.data[0] > maxNum){
              isQuery = false
            }
          })
          if(!isQuery){
            this.$message({
              message: '操作已取消，查询的数据太多',
              type: 'warning',
              duration:500
            });
            return
          }
        }
        TaosRestful.rawSqlWithDB(this.consoleInput,this.theDB,payload).then(data => {
          if(data.data){
            // let info = ''
            // info += `数据数量:&nbsp;&nbsp;${data.count}<br/>`
            // info += `数据列:&nbsp;&nbsp;${data.head}<br/>`
            // info += `数据:&nbsp;&nbsp;${data.data}<br/>`
            this.$message({
              message: '执行成功',
              type: 'success',
              duration:500
            });
            this.consoleResult = data
            //数据
            this.sqlTableData = data.data
            //字段
            this.sqlDataType = Object.keys(data.dataType)
          } else {
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
          }

        })
      },
      closeSuperTdialog(){
        this.SuperTdialogText = ""
        this.SuperTdialog = false
      },
      closeTdialog(){
        this.TdialogText = ""
        this.Tdialog = false
      },
      STChooseAll(){
        this.surperTableFilter.fields = this.surperTableLabelItems
      },
      STChooseReverse(){
        let newFields = this.surperTableLabelItems.filter((item) => {
            return this.surperTableFilter ? this.surperTableFilter.fields.indexOf(item) == -1 : false;
        })
        this.surperTableFilter.fields = newFields
      },
      TChooseAll(){
        this.tableFilter.fields = this.tableLabelItems
      },
      TChooseReverse(){
        let newFields = this.tableLabelItems.filter((item) => {
            return this.tableLabelItems.fields? this.tableLabelItems.fields.indexOf(item) == -1: false;
        })
        this.tableFilter.fields = newFields
      }

    }
  })


