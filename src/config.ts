
// 请求上下文
// request context
export const REQCONTEXT = {
  hostname: 'www.nipic.com',
  path: '/design/shengwu/yesheng/index.html',
  port: 80,
  headers: {
    'Cache-Control': 'max-age=0',
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.87 Safari/537.36",
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
  },
  timeout: 3000
}

// html选择器，挑选出img元素
// html selector, pick img elements
export const SELECTOR: string = '.new-search-result-box img'

// 默认最多开五个子线程下载
// number of used download threads, default to 5
export const MAX_THREADS: number = 5

// 最多下载张数，设为0不限制
// maximum dowload number, set to 0 as Infinity
export const LIMITATION: number = 8

// 图片存储文件夹路径
// image saving path
export const DOWN_FILE_DIR_PATH: string = './down'

// 开启debug
export const ENABLE_DEBUG: boolean = false
