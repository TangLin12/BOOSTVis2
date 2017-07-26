import tkinter as tk
from tkinter import font
from tkinter import ttk
from tkinter.filedialog import askopenfilename


def center(toplevel):
    toplevel.update_idletasks()
    w = toplevel.winfo_screenwidth()
    h = toplevel.winfo_screenheight()
    size = tuple(int(_) for _ in toplevel.geometry().split('+')[0].split('x'))
    x = w / 2 - size[0] / 2
    y = h / 2 - size[1] / 2
    toplevel.geometry("%dx%d+%d+%d" % (size + (x, y)))

GRID_FILLUP = tk.N+tk.S+tk.E+tk.W

class BOOSTVisGUI(object):
    # intro_text = """
    #     Press Configure to update and check the configurations,\nthen Visualize to visualize the selected model."""

    intro_text = "Press Configure to update and check the configurations, then Visualize to visualize the selected model."
    
    format_options = ["csv", "numpy"]
    backend_options = ["LightGBM", "XGBoost"]
    
    gui = tk.Tk()
    gui.grid()
    gui.resizable(width=False, height=False)
    gui.title("BOOSTVis Entry GUI")

    # input elements
    training_dataset_path_selector = None
    validation_dataset_path_selector = None
    model_path_selector = None
    config_path_selector = None
    format_selector = None
    backend_selector = None

    format_variable = tk.Variable(gui)
    backend_variable = tk.Variable(gui)

    interal_padding_top = 1
    interal_padding_bottom = 1
    internal_padding_y = [interal_padding_top, interal_padding_bottom]
    external_padding_left = 10
    external_padding_right = 2
    external_padding_x = [external_padding_left, external_padding_right]
    external_padding_top = 7
    external_padding_bottom = 5
    external_padding_y = [external_padding_top, external_padding_bottom]
    
    def __init__(self):
        self.create_header()
        self.create_dataset_configuration_section()
        self.create_model_configuration_section()
        center(self.gui)
        self.gui.mainloop()

    def gui_grid_width(self):
        return self.gui.grid_size()[0]

    def gui_grid_height(self):
        return self.gui.grid_size()[1]

    def gui_add_separator(self):
        sep = ttk.Separator(self.gui, orient=tk.HORIZONTAL)
        sep.grid(row=self.gui_grid_height(), columnspan=self.gui_grid_width(), sticky="ew", pady=[2,3])

    def create_header(self):
        header_frame = self.gui
        header_frame.grid()
        configure_button = tk.Button(header_frame)
        configure_button["text"] = "Configure"
        configure_button.grid(row=0, column=0, sticky=GRID_FILLUP)
        visualize_button = tk.Button(header_frame)
        visualize_button["text"] = "Visualize"
        visualize_button.grid(row=0, column=1, sticky=GRID_FILLUP)
        intro_label = tk.Label(header_frame, anchor=tk.W)
        intro_label["text"] = self.intro_text
        intro_label.grid(row=0, column=2, columnspan=4, sticky=GRID_FILLUP, padx=self.external_padding_left, pady=self.external_padding_y)
        self.gui_add_separator()

    def add_section_title(self, title):
        row_start = self.gui_grid_height()
        label = tk.Label(self.gui)
        label["text"] = title
        f = font.Font(font=label['font'])
        f = f.actual()
        label["font"] = (f["family"], f["size"] + 3)
        label.grid(row=row_start, columnspan=6, sticky=GRID_FILLUP, pady=self.external_padding_y)

    def add_selector(self, string, options, variable):
        row_start = self.gui_grid_height()
        label = tk.Label(self.gui)
        label["text"] = string
        label.grid(row=row_start, column=0, sticky=tk.W, columnspan=3)
        selector = ttk.Combobox(self.gui, textvariable=variable)
        selector["values"] = options
        selector.grid(row=row_start, column=3, columnspan=3, sticky=GRID_FILLUP,
                                  padx=self.external_padding_x, pady=self.internal_padding_y)
        return selector

    def add_path_picker(self, string, command):
        row_start = self.gui_grid_height()
        label = tk.Label(self.gui)
        label["text"] = string
        label.grid(row=row_start, column=0, columnspan=3, sticky=tk.W)
        picker = tk.Button(self.gui, command=command)
        picker.grid(row=row_start, column=3, columnspan=3, sticky=GRID_FILLUP,
                                                   padx=self.external_padding_x, pady=self.internal_padding_y)
        return picker

    def create_dataset_configuration_section(self):
        self.add_section_title("Dataset Configuration")
        self.training_dataset_path_selector = self.add_path_picker("Training data path:", self.training_dataset_handler)
        self.validation_dataset_path_selector = self.add_path_picker("Validation data path:", self.validation_dataset_handler)
        self.format_selector = self.add_selector("Format:", self.format_options, self.format_variable)
        self.gui_add_separator()

    def create_model_configuration_section(self):
        self.add_section_title("Model Configuration")
        self.backend_selector = self.add_selector("Backend:", self.backend_options, self.backend_variable)
        self.model_path_selector = self.add_path_picker("Model path:", self.model_path_handler)
        self.config_path_selector = self.add_path_picker("Config path:", self.config_path_handler)
        self.gui_add_separator()
    
    def training_dataset_handler(self):
        return self.path_handler(self.training_dataset_path_selector)
    
    def validation_dataset_handler(self):
        return self.path_handler(self.validation_dataset_path_selector)

    def model_path_handler(self):
        return self.path_handler(self.model_path_selector)

    def config_path_handler(self):
        return self.path_handler(self.config_path_selector)

    def path_handler(self, selector):
        filepath = askopenfilename()
        print(filepath)
        if filepath:
            selector["text"] = filepath
        return filepath
    


if __name__ == '__main__':
    boostvis = BOOSTVisGUI()
