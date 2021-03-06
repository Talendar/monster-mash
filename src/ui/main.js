// Copyright 2020-2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function importFile(obj, fileName, onloadendFunc) {
  if (obj.files.length == 0) return;
  var reader = new FileReader();
  reader.onload = function(event) {
    const fileContent = event.target.result;
    FS.writeFile(fileName, new Uint8Array(fileContent));
  }
  reader.onloadend = onloadendFunc;
  reader.readAsArrayBuffer(obj.files[0]);
  obj.value = ''; // clear the value so that it's possible to upload the same file once again
}

// open/save project, import/export template
$('#dropdownOpenProject').click(function() {
  $('#buttonOpenProject').click();
});
$('#buttonOpenProject').change(function() {
  $('#buttonDraw').click();
  importFile(this, "/tmp/projectOpened.zip", function() {
    Module._openProject();
  });
});
$('#buttonSaveProject, #dropdownSaveProject').click(function() {
  Module._saveProject();
});
$('#buttonExportTextureTemplate, #buttonExportTextureTemplateFileMenu').click(function() {
  Module._exportTextureTemplate();
});
$('#buttonImportTemplateImage').change(function() {
  importFile(this, "/tmp/template.img", function() {
    Module._loadTemplateImage();
    $('#buttonShowTemplateImage').prop('checked', true);
  });
});
$('#buttonImportBackgroundImage').change(function() {
  importFile(this, "/tmp/bg.img", function() {
    Module._loadBackgroundImage();
    $('#buttonShowBackgroundImage').prop('checked', true);
  });
});

// function for C with JS interaction
function js_reconstructionFinished() {
  document.getElementById('spinnerAnimate').style.display = 'none';
  document.getElementById('spinnerInflateMode').style.display = 'none';
}
function js_reconstructionFailed() {
  document.getElementById('spinnerAnimate').style.display = 'none';
  document.getElementById('spinnerInflateMode').style.display = 'none';
  alert('Reconstuction failed or the canvas is empty.');
}
function js_projectSaved() {
  const content = FS.readFile("/tmp/mm_project.zip");
  var blob = new Blob([content], {type: "application/zip" });
  saveAs(blob, "mm_project.zip");
}
function js_projectOpened() {
  resetToModuleState();
}
function js_manipulationModeChanged(newMode) {
  switch (newMode) {
    default: case 0: $('#dropdownImageModeDraw').click();$('#buttonDraw').focus(); break;
    case 1: $('#dropdownImageModeRedraw').click();$('#buttonRedraw').focus(); break;
    case 2: $('#buttonInflateMode').click();$('#buttonInflateMode').focus(); break;
    case 3: $('#buttonAnimate').click();$('#buttonAnimate').focus(); break;
  }
}
function js_textureTemplateExported() {
  const content = FS.readFile("/tmp/mm_template.png");
  var blob = new Blob([content], {type: "image/png" });
  saveAs(blob, "mm_template.png");
}
function js_frameExportedToOBJ() {
  const content = FS.readFile("/tmp/mm_frame.obj");
  var blob = new Blob([content], {type: "model/obj" });
  saveAs(blob, "mm_frame.obj");
  
  if (Module._hasTemplateImage() && Module._getTemplateImageVisibility()) {
    var timeout = 100;
    setTimeout(function() {
        const content = FS.readFile("/tmp/mm_frame.mtl");
        var blob = new Blob([content], {type: "model/mtl" });
        saveAs(blob, "mm_frame.mtl");
    }, timeout);        
    setTimeout(function() {
        const content = FS.readFile("/tmp/mm_frame.png");
        var blob = new Blob([content], {type: "image/png" });
        saveAs(blob, "mm_frame.png");
    }, 2*timeout);
  }
}
function js_recordingModeStopped() {
  $('.buttonRecord').removeClass('active');
}

function resetToModuleState() {
  $('#buttonRotate').removeClass('active');
  if (Module._isMiddleMouseSimulationEnabled()) $('#buttonRotate').addClass('active');
  $('#buttonShowControlPins').prop('checked', Module._getCPsVisibility());
  $('#buttonShowTemplateImage').prop('checked', Module._getTemplateImageVisibility());
  $('#buttonShowBackgroundImage').prop('checked', Module._getBackgroundImageVisibility());
  $('#buttonUseTextureShading').prop('checked', Module._isTextureShadingEnabled());
  $('#buttonEnableArmpitsStitching').prop('checked', Module._isArmpitsStitchingEnabled());
  $('#buttonEnableNormalSmoothing').prop('checked', Module._isNormalSmoothingEnabled());

  var $buttonPlayPauseCurr = $('input[name=buttonPlayPause][value='+Module._isAnimationPlaying()+']');
  $('input[name=buttonPlayPause]').parent().parent().removeClass('active');
  $buttonPlayPauseCurr.parent().parent().addClass('active');
  $buttonPlayPauseCurr.prop('checked', true);

  $('.buttonRecord').removeClass('active');
}

// event listener
$(window).keyup(function(e) {
  e.preventDefault();
  if (e.which === 49 || e.which === 97) $('#dropdownImageModeDraw').click();
  if (e.which === 52 || e.which === 100) $('#dropdownImageModeRedraw').click();
  if (e.which === 50 || e.which === 98) $('#buttonInflateMode').click();
  if (e.which === 51 || e.which === 99) $('#buttonAnimate').click();
  if (e.which === 78) $('#buttonNewProject').click();
  if (e.which === 32) $('input[name=buttonPlayPause]').not(':checked').click();
  if (e.which === 69) $('#buttonRecord').click();
  if (e.which === 72) $('#buttonShowControlPins').click();
  if (e.ctrlKey && e.which === 79) $('#buttonOpenProject').click();
  if (e.ctrlKey && e.which === 83) $('#buttonSaveProject').click();
});

function showRecordButton() {
  $('.buttonRecord').removeClass('disabled');
  $('.buttonRecord div input').prop('disabled', false);
}
function hideRecordButton() {
  $('.buttonRecord').removeClass('disabled');
  $('.buttonRecord').addClass('disabled');
  $('.buttonRecord div input').prop('disabled', true);
}
function showAnimationModeControls() {
  $('.animationButtons label').removeClass('disabled');
  $('.animationButtons label div input').prop('disabled', false);
  if ($('#buttonRotate').hasClass('active')) {
    hideRecordButton();
  } else {
    showRecordButton();
  }
}
function hideAnimationModeControls() {
  $('.animationButtons label').removeClass('disabled');
  $('.animationButtons label').addClass('disabled');
  $('.animationButtons label div input').prop('disabled', true);
}
function showGeometryModeControls() {
  $('.buttonsViewOptions div label').removeClass('disabled');
  $('.buttonsViewOptions div label input').prop('disabled', false);
  $('.buttonsViewOptions button').removeClass('disabled');
  $('.buttonsViewOptions button').prop('disabled', false);
  $('#buttonExportAsOBJ').removeClass('disabled');
}
function hideGeometryModeControls() {
  $('.buttonsViewOptions div label').removeClass('disabled');
  $('.buttonsViewOptions div label').addClass('disabled');
  $('.buttonsViewOptions div label input').prop('disabled', true);
  $('.buttonsViewOptions button').removeClass('disabled');
  $('.buttonsViewOptions button').addClass('disabled');
  $('.buttonsViewOptions button').prop('disabled', true);
  $('#buttonExportAsOBJ').removeClass('disabled');
  $('#buttonExportAsOBJ').addClass('disabled');
}

$('.dropdownImageMode').click(function(e) {
  var id = this.id;
  $('.dropdownImageMode').removeClass('active');
  $(this).addClass('active');
  if (id == 'dropdownImageModeRedraw') {
    $('.buttonImageMode').css('display', 'none');
    $('#buttonRedraw').css('display', 'inline-block');
    $('#buttonRedraw').click();
  } else
  if (id == 'dropdownImageModeDraw') {
    $('.buttonImageMode').css('display', 'none');
    $('#buttonDraw').css('display', 'inline-block');
    $('#buttonDraw').click();
  }
});

$('.buttonMode').click(function(e) {
  var id = this.id;
  $('.buttonMode').removeClass('active');
  var mode = 0;
  var prevMode = Module._getManipulationMode();
  if (id == 'buttonDraw') {
    mode = 0;
    hideAnimationModeControls();
    hideGeometryModeControls();
  } else if (id == 'buttonRedraw') {
    mode = 1;
    hideAnimationModeControls();
    hideGeometryModeControls();
  } else if (id == 'buttonInflateMode') {
    if (prevMode < 2) {
      $('#spinnerInflateMode').css('display', 'inline-block');
    }
    mode = 2;
    hideAnimationModeControls();
    showGeometryModeControls();
  } else if (id == 'buttonAnimate') {
    if (prevMode < 2) {
      $('#spinnerAnimate').css('display', 'inline-block');
    }        
    mode = 3;
    showAnimationModeControls();
    showGeometryModeControls();
  }
  var timeout = 50;
  setTimeout(function() {
    Module._setManipulationMode(mode);
    var currMode = Module._getManipulationMode();
    if (mode != currMode) {
      js_manipulationModeChanged(currMode);
    }
  }, timeout);
});

$('#buttonAnimateAntelope').click(function() {
  $('#buttonAnimate').click();
});
$('#buttonNewProject, #buttonNewProjectFileMenu').click(function() {
  if (confirm('Do you want to start over from scratch?')) {
    Module._reset();
    resetToModuleState();
    js_manipulationModeChanged(Module._getManipulationMode());
  }
});
$('#buttonRemove').click(function() {
  Module._removeControlPointOrRegion();
});
$('#buttonRotate').change(function(e) {
  var active = $(this).hasClass('active');
  Module._enableMiddleMouseSimulation(active);
  var animateModeActive = $('#buttonAnimate').hasClass('active');
  if (animateModeActive) {
    if (active) hideRecordButton();
    else showRecordButton();
  }
});
$('#buttonResetView').click(function() {
  Module._resetView();
});
$('#buttonShowControlPins').change(function() {
  Module._setCPsVisibility(this.checked);
});
$('#buttonRecord').click(function() {
  Module._cpRecordingRequestOrCancel();
});
$('input[name=buttonPlayPause]').change(function() {
  Module._toggleAnimationPlayback();
});
$('#buttonShowHelp').click(function() {
  $('.tutorialVideos video').trigger('pause');
  $('.tutorialVideos div').show();
  $('.tutorialVideos video:first').trigger('play');
  $('.tutorialVideos div:first').hide();
  $('.tutorialVideos video').removeAttr("controls");
  $('.tutorialVideos video:first').attr("controls", "controls");
  
  var isApple = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
  if (isApple) {
    $('.ctrl').text('Cmd');
  }
  
  $('#modalDialogQuickTutorial').modal();
});
$('#buttonShowTemplateImage').click(function() {
  Module._setTemplateImageVisibility(this.checked);
});
$('#buttonShowBackgroundImage').click(function() {
  Module._setBackgroundImageVisibility(this.checked);
});
$('#buttonUseTextureShading').change(function() {
  Module._enableTextureShading(this.checked);
});
$('#buttonShowSettings').click(function() {
  $('#modalDialogSettings').modal();
});
$('input[type=radio][name=animRecordMode]').change(function() {
  Module._setAnimRecMode(this.value);
});
$('#buttonTuneAnimation').click(function() {
  $('#modalDialogAnimationTuning').modal();
});
$('#buttonEnableArmpitsStitching').change(function() {
  var currMode = Module._getManipulationMode();
  var msg = '';
  if (currMode >= 2) {
    msg += (this.checked ? 'Enabling' : 'Disabling') + ' this setting in animation mode requires recreation of the 3D model. ';
  }
  if (this.checked) {
    msg += 'Note that this is an experimental feature that may cause Monster Mash to crash and you may lose the current project. ';
  }
  if (msg == '') {
    Module._enableArmpitsStitching(this.checked);
  } else
  if (confirm(msg + 'Proceed?')) {
    Module._enableArmpitsStitching(this.checked);
    if (currMode >= 2) {
      $('#buttonDraw').click();
      js_manipulationModeChanged(currMode);
    }
  } else {
    this.checked = !this.checked;
  }
});
$('#buttonEnableNormalSmoothing').change(function() {
  Module._enableNormalSmoothing(this.checked);
});
$('.tutorialVideos').click(function() {
  $('.tutorialVideos div').show();
  $("div", this).hide();
  $('.tutorialVideos video').trigger('pause');
  $('.tutorialVideos video').removeAttr("controls");
  $("video", this).attr("controls", "controls");
  $("video", this).trigger('play');
});
$('.examples').click(function() {
  if (confirm('Do you want to discard the current project and open this example?')) {
    $('#modalDialogQuickTutorial').modal('hide');
    var exampleId = $(this).data("exampleid");
    Module._openExampleProject(exampleId);
  }
});
$('#buttonSelectAll').click(function() {
  Module._selectAll();
});
$('#buttonDeselectAll').click(function() {
  Module._deselectAll();
});
$('#buttonCopyAnimation').click(function() {
  Module._copySelectedAnim();
});
$('#buttonPasteAnimation').click(function() {
  Module._pasteSelectedAnim();
});
$('#buttonExportAsOBJ').click(function() {
  Module._exportAsOBJ();
});

// initialize tooltips
$('#buttonShowHelp[data-tooltip="tooltip"]').tooltip({
  trigger : 'hover',
  delay: { 'show': 500, 'hide': 100 },
  boundary: 'window'
});

function handleResize() {
  var h1 = $(window).height();
  var h2 = $('.navbar').height();
  var h3 = $('canvas').height();
  var m = (0.5*(h1) - h2 - 0.5*h3);
  if (m < 0) m = 0;
  $('canvas').css({"margin-top": m + "px"});
}
$(window).resize(handleResize);
$(window).on('mainContentVisible', function() {
  $('.appVersion').text(Module._getVersion());
  handleResize();
  
  var $buttonHelpToolTip = $('#buttonShowHelp[data-tooltip="tooltip"]');
  setTimeout(function() {
    $buttonHelpToolTip.tooltip('show');
  }, 500);        
  setTimeout(function() {
    $buttonHelpToolTip.tooltip('hide');
  }, 10000);
  $('body').click(function () {
    $('[data-tooltip="tooltip"]').tooltip('hide');
  });
});
