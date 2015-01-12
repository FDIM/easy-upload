## Purpose
To simplify upload handling with drag and drop with multiple forms and fallback to iframe upload for browsers not supporting ajax file upload. 

## JS code with optional block UI
$('form').easyUpload({
		onDragStart: function() {
			$.blockUI({message: t('msg.DropFileAnywhereToUpload')});
		},
		onDragStop: function() {
			$.unblockUI();
		},
		onCancel: function() {
			$.unblockUI();
		},
		onError: function(form, response, message) {
			$.unblockUI();
			alert("An error occured"+(message?': '+message:''));
		},
		onSuccess: function(form, file, response) {
			$('.blockMsg').append(response);
			$.unblockUI();
		},
		onStart: function(form) {
			if (!$('.blockMsg').is(':visible')) {
				$.blockUI();
			}
			progress.find('>div').width("0%");
			$('.blockMsg').html(tt('layout.blockui.message')).append(progress);
		},
		onProgress: function(form, file, percent) {
			progress.find('>div').width(percent + "%");
		}
	});
	
	## Html
	<form data-accept="jpg,jpeg,png,tiff,gif,mov,mp4,avi,wmv,flv,3gp,webm,zip" action="your-upload-handler" method="POST" enctype="multipart/form-data">
		<h2>Upload Product Media: </h2>
		<label for="file">Upload file: </label>
		<input type="file" name="file" />
		<div class="actions">
			<button class="submit btn btn-primary" type="submit" name="upload">Upload</button>
			<button class="cancel btn btn-default">Cancel</button>
			<div class="clear"></div>
		</div>
	</form>
	
	## Note for iframes
	You must return some js code to invoke some function on parent frame:
	e.g.
	function updateUploadStatus(valid, msg){
	  if (!valid)
		{
			alert(msg);
			return false;
		}
		Dialog.hide();
		window.location = window.location;
	}
	and in upload handler return something like this:
	<script type="text/javascript">window.parent.updateUploadStatus(false,'Unsupported format');</script>';
	
