$(() => {
  $('#titleBarClose').on('click', async () => {
    remote.getCurrentWindow().close()
  })
  $('#titleBarResize').on('click', () => {
    remote.getCurrentWindow().maximize()
  })
  $('#titleBarMinimize').on('click', () => {
    remote.getCurrentWindow().minimize()
  })
})