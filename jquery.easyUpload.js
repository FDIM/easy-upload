/**
 * @author Domas Trijonis
 * @returns jQuery
 */
$(function () {
	var defaults = {
		container: $(document),
		formKey: 'file',
		onDragStart: function () {
		},
		onDragStop: function () {
		},
		onCancel: function () {

		},
		onError: function ($form, file, response) {

		},
		onSuccess: function ($form, file, response) {

		},
		onStart: function ($form, file) {

		},
		onProgress: function ($form, file, percent) {

		},
		types: {}
	};
	// upload file
	var upload = function ($form, file, ops) {
		var fd = new FormData($form.get(0));
		fd.append($form.find('*[type^=file]').prop('name'), file);

		ops.onStart.apply(ops.container.eq(0),[$form, file]);

		$.ajax({
			url: $form.attr('action'),
			data: fd,
			processData: false,
			contentType: false,
			type: 'POST',
			dataType: 'html',
			xhr: function () {
				var xhr = new window.XMLHttpRequest();
				xhr.upload.addEventListener("progress", function (evt) {
					if (evt.lengthComputable) {
						var percentComplete = evt.loaded / evt.total;
						ops.onProgress.apply(ops.container.eq(0),[$form, file, 100 * percentComplete]);
					} else {
						ops.onProgress.apply(ops.container.eq(0),[$form, file, undefined]); // unknown
					}
				}
				, false);

				return xhr;
			},
			success: function (data) {
				ops.onSuccess.apply(ops.container.eq(0),[$form, file, data]);
			},
			error: function (xhr, status, error) {
				ops.onError.apply(ops.container.eq(0),[$form, file, xhr.responseText]);
			}
		});
	};
	var chooseForm = function (ext, ops) {
		if (typeof ops.types[ext] !== 'undefined') {
			return ops.types[ext];
		}
		return ops.types["*"];
	};
	var handleUpload = function (files, ops) {
		if (files.length === 0) {
			ops.onCancel.apply(ops.container.eq(0),[]);
			return;
		}
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var parts = file.name.split('.');
			var ext = parts[parts.length - 1];
			var form = chooseForm(ext, ops);

			if (typeof form === 'undefined') {
				ops.onError.apply(ops.container.eq(0),[undefined, file, "Unsupported file"]);
			}else{
				upload(form, file, ops);
			}
		}
	};
	var onFormSubmit = function ($form, ops) {
		var files = $form.find('input[name=' + ops.formKey + ']').get(0).files;
		handleUpload(files, ops);
	};
	var initIframeTransport = function ($form, ops) {
		var name = "iframe-upload-" + (new Date().getTime());
		var iframe = $('<iframe>');
		iframe.prop('name', name);
		iframe.hide();
		$('body').append(iframe);
		$form.prop('target', name);
		iframe.bind('load', function () {
			ops.onSuccess.apply(ops.container.eq(0),[$form, undefined, iframe.find('body').html()]);
		});
		ops.iframe = iframe;
	};
	var initDragAndDrop = function (ops) {
		var counter = 0;
		var dragging = false;
		// enable drag&drop upload
		ops.container.on('dragenter.easyUpload', function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (counter++ === 0 && !dragging) {
				ops.onDragStart.apply(this);
				dragging = true;
			}
			return false;
		}).on('dragleave.easyUpload', function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (--counter === 0 && dragging) {
				ops.onDragStop.apply(this);
				dragging = false;
			}
			return false;
		}).on('dragover.easyUpload', function (e) {
			e.preventDefault();
		}).on('drop.easyUpload', function (e) {
			e.preventDefault();
			e.stopPropagation();
			dragging = false;
			counter = 0;
			// now do something with:
			var files = e.originalEvent.dataTransfer.files;
			handleUpload(files, ops);
			return false;
		});
	};
	$.fn.easyUpload = function (options) {
		if (options === 'destroy') {
			this.each(function () {
				var $this = $(this);
				var ops = $this.data('easyUploadOps');
				if (ops) {
					$this.unbind('.easyUpload');
					ops.container.unbind('.easyUpload');
					if(ops.iframe){
						ops.iframe.remove();
					}
					ops.onCancel.apply(ops.container.eq(0),[]);
				}
			});
			return;
		}
		// no support for file upload
		if (typeof FormData === 'undefined') {
			this.each(function () {
				var ops = $.extend({}, defaults, options);
				initIframeTransport($(this), ops);
			});
			return this;
		}
		// bind to each form
		var dragAndDropInitialized = false;
		var ops = $.extend({}, defaults, options);
		ops.types = ops.types || {};
		this.each(function () {
			var accepts = $(this).data('accept');
			if (typeof accepts !== 'undefined') {
				accepts = accepts.split(',');
				for (var i in accepts) {
					ops.types[accepts[i]] = $(this);
				}
			} else {
				ops.types['*'] = $(this);
			}
			if(!dragAndDropInitialized){
				initDragAndDrop(ops);
				dragAndDropInitialized = true;
			}
			$(this).bind('submit.easyUpload', function (e) {
				e.preventDefault();
				onFormSubmit($(this), ops);
				return false;
			}).data('easyUploadOps', ops);
		});
		return this;
	};
	$.fn.easyUpload.defaults = defaults;
});