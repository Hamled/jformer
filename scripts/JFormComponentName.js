JFormComponentName = JFormComponent.extend({
    init: function(parentJFormSection, jFormComponentId, jFormComponentType, options) {
        this._super(parentJFormSection, jFormComponentId, jFormComponentType, options);
    },

    initialize: function(){
        this.tipTarget = this.component.find('input:last');
        if(this.options.emptyValue){
            this.addEmptyValues();
        }
        this.changed = false;
        this.validationFunctions = {
            'required': function(options) {
                var errorMessageArray = [];
                if(options.value.firstName == '') {
                    errorMessageArray.push(['First name is required.']);
                }
                if(options.value.lastName == '') {
                    errorMessageArray.push(['Last name is required.']);
                }
                return errorMessageArray.length < 1 ? 'success' : errorMessageArray;
            }
        }
    },

    setValue: function(data) {
        var self = this;
        if(this.options.emptyValue){
            if(data.firstName != self.options.emptyValue.firstName){
                self.component.find('input[id*=firstName]').removeClass('defaultValue').val(data.firstName).blur();
            }
            self.component.find('input[id*=middleInitial]').removeClass('defaultValue').val(data.middleInitial).blur();
            if(data.lastName != self.options.emptyValue.lastName){
                self.component.find('input[id*=lastName]').removeClass('defaultValue').val(data.lastName).blur();
            }
        } else {
            self.component.find('input[id*=firstName]').val(data.firstName)
            self.component.find('input[id*=middleInitial]').val(data.middleInitial);
            self.component.find('input[id*=lastName]').val(data.lastName);
        }
        this.validate(true);

        /*
        $.each(data, function(key, value){
            if(data[key] != self.options.emptyValue[key]){
                self.component.find('input[id*='+key+']').removeClass('defaultValue').val(value).blur().trigger('component:changed');
            }
        });*/
    },

    getValue: function() {
        if(this.disabledByDependency || this.parentJFormSection.disabledByDependency){
           return null;
        }
        var name = {},
        self = this;
        name.firstName = this.component.find('input[id*=firstName]').val();
        name.middleInitial = this.component.find('input[id*=middleInitial]').val();
        name.lastName = this.component.find('input[id*=lastName]').val();

        if(this.options.emptyValue){
            if(name.firstName == this.options.emptyValue.firstName){
                name.firstName = '';
            }
            if(this.component.find('input[id$=middleInitial]').hasClass('defaultValue') ){
                name.middleInitial = '';
            }
            if(name.lastName == this.options.emptyValue.lastName){
                name.lastName = '';
            }
        }

        return name;
    },

    validate: function(silent, options){
        if(!this.parentJFormSection.parentJFormPage.jFormer.options.clientSideValidation) {
            return;
        }

        var self = this;
        if(!this.changed){
            this._super();
        }

        var componentPromise = $.Deferred();
        
        setTimeout(function() {
            if(!self.component.hasClass('jFormComponentHighlight')){
                if(self.options.validationOptions.length < 1){
                    return true;
                }
                self.clearValidation();

                var validationPromises = [];
                $.each(self.options.validationOptions, function(validationType, validationOptions){
                    validationOptions['callOptions'] = options || {};
                    validationOptions['value'] = self.getValue();
                    validationPromises.push(self.validationFunctions[validationType](validationOptions).done(function(validation) {
                        if(validation != 'success'){
                            $.merge(self.errorMessageArray, validation);
                        }
                    }));
                });

                $.when.apply($, validationPromises).done(function() {
                    // Determine if all validations passed
                    var validationResults = Array.prototype.slice.call(arguments);
                    var validationPassed = validationResults.every(function(result) {
                        return (result === 'success');
                    });

                    if(self.errorMessageArray.length > 0 ){
                        self.handleErrors();
                    }

                    self.changed = false;

                    componentPromise.resolve(validationPassed ? 'success' : self.errorMessageArray);
                });
            }
        }, 1);

        return componentPromise;
    },

    addEmptyValues: function(){
        var self = this,
        emptyValue = this.options.emptyValue;
        $.each(emptyValue, function(key, value){
            var input = self.component.find('input[id*='+key+']');
            input.addClass('defaultValue');
            input.focus(function(event){
                if ($.trim($(event.target).val()) == value ){
                    $(event.target).val('');
                    $(event.target).removeClass('defaultValue');
                }
            });
            input.blur(function(event){
                if ($.trim($(event.target).val()) == '' ){
                    $(event.target).addClass('defaultValue');
                    $(event.target).val(value);
                }
            });
            input.trigger('blur');
        });
    }
});
