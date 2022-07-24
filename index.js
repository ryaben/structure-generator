$(document).ready(function($) {
    function saveAsFile(t,f,m) {
        try {
            var b = new Blob([t],{type:m});
            saveAs(b, f);
        } catch (e) {
            window.open("data:"+m+"," + encodeURIComponent(t), '_blank','');
        }
    }

    class Handler {
        constructor() {
            this.chapters = [];
        }

        eventListening(handler) {
            $('#addChapter').on('click', function() {
                handler.addChapter($('#chapterNameInput').val(), $('#chapterTitleInput').val(), $('#chapterVisibility').is(':checked'));
            });

            $('#addSlide').on('click', function() {
                handler.addSlide($('#slideNameInput').val(), $('#chapterSelect option:selected').index());
            });

            $('#chapterNameInput').on('input', function() {
                handler.toggleButton($(this), $('#chapterTitleInput'), $('#addChapter'));
            });

            $('#chapterTitleInput').on('input', function() {
                handler.toggleButton($(this), $('#chapterNameInput'), $('#addChapter'));
            });

            $('#slideNameInput').on('input', function() {
                handler.toggleButton($(this), $('#chapterSelect'), $('#addSlide'));
            });

            $('#generateJSON').on('click', function() {
                handler.generateJSON();
            });

            $('#previewTree').on('click', '.chapter-preview-name, .slide-preview-name', function() {
                handler.toggleSelection($(this));
            });

            $('#newNameInput').on('input', function() {
                if ($('.chapter-preview-name').length > 0) {
                    handler.toggleButton($(this), $(this), $('#renameElement'));
                }
            });

            $('#renameElement').on('click', function() {
                handler.renameElement($('#previewTree .selected'));
            });

            $('#removeElement').on('click', function() {
                handler.removeElement($('#previewTree .selected'));
            });

            $('#formatJSON').on('click', function() {
                handler.formatJSON($('#sourceJSON').val());
            });

            $('#sourceJSON').on('input', function() {
                handler.toggleButton($(this), $(this), $('#formatJSON'));
                handler.toggleButton($(this), $(this), $('#downloadSlidesFolder'));
            });

            $('#downloadSlidesFolder').on('click', function() {
                handler.generateSlidesFolder($('#sourceJSON').val(), $('#customTemplates').is(':checked'), $('#customSlideTemplateSource').val(), $('#customPopupTemplateSource').val());
            });

            $('#customTemplates').on('change', function() {
                handler.toggleTemplateInputs();
            });
        }

        toggleTemplateInputs() {
            $('.custom-template-source').slideToggle(300);
        }

        renameElement(element) {
            let newName = $('#newNameInput').val();

            if (element.hasClass('chapter-preview-name')) {
                let index = $('.chapter-preview-name').index(element);

                element.text(newName);
                $(`#chapterSelect option:eq(${index})`).text(newName);
                this.chapters[index].name = newName;

            } else if (element.hasClass('slide-preview-name')) {
                let parentId = element.parent().attr('id');
                let index = $(`#${parentId} .slide-preview-name`).index(element);
                let parentIndex = $('.chapter-preview-name').index(element.siblings('.chapter-preview-name:eq(0)'));
                
                element.text(newName);
                this.chapters[parentIndex].slides[index].name = newName;
            }

            $('#newNameInput').val('');
        }

        removeElement(element) {
            if (element.hasClass('chapter-preview-name')) {
                let index = $('.chapter-preview-name').index(element);

                element.remove();
                $(`#chapterSelect option:eq(${index})`).remove();
                this.chapters.splice(index, 1);

            } else if (element.hasClass('slide-preview-name')) {
                let parentId = element.parent().attr('id');
                let index = $(`#${parentId} .slide-preview-name`).index(element);
                let parentIndex = $('.chapter-preview-name').index(element.siblings('.chapter-preview-name:eq(0)'));

                element.remove();
                this.chapters[parentIndex].slides.splice(index, 1);
            }

            $('#renameElement').attr('disabled', 'disabled');
            $('#removeElement').attr('disabled', 'disabled');
        }

        toggleSelection(element) {
            $('.chapter-preview-name').removeClass('selected');
            $('.slide-preview-name').removeClass('selected');
            element.addClass('selected');

            if ($('#renameElement').val() != "") {
                $('#renameElement').removeAttr('disabled');
            }
            $('#removeElement').removeAttr('disabled');
        }

        toggleButton(targetElement, relatedElement, button) {
            if (targetElement.val() != "" && relatedElement.val() != "") {
                button.removeAttr('disabled');
            } else {
                button.attr('disabled', 'disabled');
            }
        }

        addChapter(name, title, visible) {
            this.chapters.push(
                new Chapter(name, title, visible)
            );

            $('#previewTree').append(`
                <ul id="${name}Chapter" class="chapter-preview">
                    <p class="chapter-preview-name visibility-${visible}">${name}</p>
                </ul>
            `);

            $('#chapterSelect').append(`
                <option class="chapter-option">${name}</option>
            `);

            $('#chapterNameInput').val("");
            $('#chapterTitleInput').val("");
            $('#addChapter').attr('disabled', 'disabled');
        }

        addSlide(name, index) {
            this.chapters[index].slides.push(
                new Slide(name)
            );

            $(`.chapter-preview:eq(${index})`).append(`
                <li class="slide-preview-name">${name}</li>
            `);
        }

        generateJSON() {
            let structureJSON = new Object;

            structureJSON.slides = {};
            structureJSON.chapters = {};
            structureJSON.storyboard = [];

            for (let i = 0; i < this.chapters.length; i++) {
                const chapter = this.chapters[i];

                if (chapter.visible) {
                    structureJSON.storyboard.push(chapter.name);
                }
                
                structureJSON.chapters[chapter.name] = {
                    name: chapter.title,
                    content: []
                }

                for (let j = 0; j < chapter.slides.length; j++) {
                    const slide = chapter.slides[j];
                    
                    structureJSON.chapters[chapter.name].content.push(slide.name);

                    structureJSON.slides[slide.name] = {
                        name: slide.title,
                        title: slide.title,
                        template: `slides/${slide.name}/index.vue`
                    }
                }
            }

            this.downloadJSON(structureJSON);
        }

        downloadJSON(json) {
            saveAsFile(JSON.stringify(json), "structure.json", "text/plain;charset=utf-8");
        }

        formatJSON(json) {
            let jsonFirstFilter = json.replace(new RegExp(`"template": "`, 'g'), `"template": "slides/`);
            let jsonSecondFilter = jsonFirstFilter.replace(new RegExp(`.html"`, 'g'), `/index.vue"`);
            saveAsFile(jsonSecondFilter, "structure.json", "text/plain;charset=utf-8");
        }

        generateSlidesFolder(structureJSON, customTemplates, customSlideTemplate, customPopupTemplate) {
            let zip = new JSZip();
            let slidesFolderZip = zip.folder('slides');
            let structure = JSON.parse(structureJSON);

            for (const slide in structure.slides) {
                let currentSlideFolder = slidesFolderZip.folder(slide);
                currentSlideFolder.folder('media').folder('images');

                if (customTemplates == false) {
                    customSlideTemplate = slideTemplate;
                    customPopupTemplate = popupTemplate;
                }

                if (slide.toString().includes('Popup') || slide.toString().includes('studyDesign')) {
                    currentSlideFolder.file('index.vue', customPopupTemplate);
                } else {
                    currentSlideFolder.file('index.vue', customSlideTemplate);
                }
            }

            zip.generateAsync({type:"blob"})
            .then(function (blob) {
                saveAs(blob, "slides.zip");
            });
        }
    }

    class Chapter {
        constructor(name, title, visible) {
            this.name = name;
            this.title = title;
            this.slides = [];
            this.visible = visible;
        }
    }

    class Slide {
        constructor(name) {
            let capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
            let filteredName = capitalizedName.match(/[A-Z][a-z]+|[0-9]+/g).join(" ");

            this.name = name;
            this.title = filteredName;
        }
    }

    handler = new Handler();
    handler.eventListening(handler);
});