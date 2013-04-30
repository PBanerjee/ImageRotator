/* Scope and self initiation */

(function(window, $){

    /*
     * @param   data    The object which contains the data as XML
     *                  or the url for the XML.
     */
    var ImageRotator = function(data){
        //list of slides
        this.slides = [];
        //need to load or parse the data.
        this.dataObj = data;
        //start data fectching or parsing
        this.dataObj && this.getData();
    };

    //default options
    ImageRotator.defaults = {

    };

    ImageRotator.prototype = {
        /*
         * function to load the data.
         */
        getData: function(){
            var dataObj = this.dataObj,
                dataXML = dataObj && dataObj.dataXML,
                dataURL = dataObj && dataObj.dataURL;
            //check if dataObj is defined or return
            if(!dataObj){
                return;
            }
            //now depending on the data type either loads the data
            //or parse it.
            if(dataXML && dataXML.length > 0){
                //parse the XML
                this.parseXML(dataXML);
            }else if(dataURL){
                //load the XML
                $.ajax({
                   url: dataURL,
                   success: this.parseXML,
                   error: function(e){
                       //@todo: need to define a proper error report
                       //mechanism.
                       console.log(e.responseText);
                   }
                });
            }
        },

        /*
         * method to parse XML
         */

        parseXML: function(xmlData){
            var xmlDoc,
                slides = this.slides || [];
            //check whether the passed data is in XML format
            //remove white spaces (trim)
            if(xmlData.childNodes){
                //direct assignments
                //@todo: how to remove whitespace in already an
                //XML document.
                xmlDoc = xmlData;
            }
            //else convert to XML
            else{
                xmlDoc = $.parseXML($.trim(xmlData));
            }
            //iterate over the slides and store data
            $(xmlDoc).find("slide").each(function(){
                var slide = {},
                    childNodes = this.childNodes,
                    numSlides = childNodes && childNodes.length,
                    i,
                    node;

                for(i = 0; i < numSlides; i += 1){
                    node = childNodes[i];

                    switch(node.nodeName.toLowerCase()){
                        case 'image' :
                            slide.image = $(node).text();
                            break;
                        case 'heading' :
                            slide.heading = $(node).text();
                            break;
                        case 'description' :
                            slide.description = $(node).text();
                            break;
                        default:
                            //do nothing
                    }
                }
                slides.push(slide);
            });
            //update class level sildes object
            debugger;
            this.slides = slides;
        }

    };

    //expose to the global scope
    window.ImageRotator = ImageRotator;

})(window, jQuery);


