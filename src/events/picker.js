'use strict'

const ioHook = require('iohook')
const {ipcMain} = require('electron')
const robot = require('robotjs')

let color;

module.exports = (storage, browsers) => {
  const {picker, colorpicker} = browsers

  ioHook.start();

  ioHook.on('mousemove', event => {
    if(!picker.getWindow()) return
    let realtime = storage.get('realtime', 'picker')
    let {x, y} = event;
    let color = '#' + robot.getPixelColor(parseInt(x), parseInt(y))
    picker.getWindow().setPosition(parseInt(x) - 50, parseInt(y) - 50)
    picker.getWindow().webContents.send('updatePicker', color)
    if (realtime) colorpicker.getWindow().webContents.send('previewColor', color)
  })

  ioHook.on('mouseup', event => {
    if(!picker.getWindow()) return
    if(event.button == 2) return closePicker();
    let {x, y} = event;
    closePicker('#' + robot.getPixelColor(parseInt(x), parseInt(y)))
  })

  let closePicker = newColor => {
    if (typeof newColor !== 'string') newColor = color
    if (picker.getWindow()) {
      colorpicker.getWindow().webContents.send('changeColor', newColor)
      colorpicker.getWindow().focus()
      ipcMain.removeListener('closePicker', closePicker)
      ipcMain.removeListener('pickerRequested', event => {})
      picker.getWindow().close()
    }
  }

  ipcMain.on('pickerRequested', event => {
    color = storage.get('lastColor')

    let pos = robot.getMousePos()
    picker.getWindow().setPosition(parseInt(pos.x) - 50, parseInt(pos.y) - 50)
    picker.getWindow().webContents.send('updatePicker', robot.getPixelColor(pos.x, pos.y))

    ipcMain.on('closePicker', closePicker)
  })
}
