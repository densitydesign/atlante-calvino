
#include <emscripten/bind.h>

#include <boost/algorithm/string.hpp>
#include <algorithm>
#include <functional>
#include <iostream>
#include <iterator>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

class file_info
{
	public:
		file_info() = delete;
		
		static const int aggregation_key_idx;
		static const int first_level_first_column_offset;
		static const int level_columns_count;
		static const int place_column_block_idx;
		static const int type_column_block_idx;
		static const string input_filename;
		static const string input_separator;
		static const string output_filename;
		static const string output_separator;
};

const int file_info::aggregation_key_idx = 0;
const int file_info::first_level_first_column_offset = 1;
const int file_info::level_columns_count = 3;
const int file_info::place_column_block_idx = 0;
const int file_info::type_column_block_idx = 1;

const string file_info::input_filename = "input_data.csv";
const string file_info::input_separator = ",";

const string file_info::output_filename = "output.json";
const string file_info::output_separator = ",";

typedef vector<string> record;

struct hierarchy
{
	string text_id;
	string node_id;
	string caption;
	int level = 0;
	string basal_type;
	string local_type;
	map<string, hierarchy> children;
};

void indent_level(ostream& os, int level)
{
	for(int i = 0; i < level; ++i) os << "  ";
}

void print_json(ostream& os, const hierarchy& h, int indentation_level)
{
	indent_level(os, indentation_level);
	os << "{\r\n";
	
	indent_level(os, indentation_level + 1);
	os << "\"text_id\": \"" << h.text_id << "\",\r\n";
	
	indent_level(os, indentation_level + 1);
	os << "\"node_id\": \"" << h.node_id << "\",\r\n";
	
	indent_level(os, indentation_level + 1);
	os << "\"caption\": \"" << h.caption << "\",\r\n";
	
	indent_level(os, indentation_level + 1);
	os << "\"level\": \"" << h.level << "\",\r\n";
	
	indent_level(os, indentation_level + 1);	
	os << "\"basal_type\": \"" << h.basal_type << "\",\r\n";
	
	indent_level(os, indentation_level + 1);	
	os << "\"local_type\": \"" << h.local_type << "\",\r\n";	
	
	indent_level(os, indentation_level + 1);
	
	os << "\"children\": [";
	
	if(!h.children.empty())
	{
		os << "\r\n";
		
		auto first = true;
		
		vector<hierarchy> ordered_children;
		
		transform(
			begin(h.children), 
			end(h.children), 
			back_inserter(ordered_children),
			[](auto map_pair) { return map_pair.second; });
		
		sort(begin(ordered_children), end(ordered_children), [](const auto& h1, const auto& h2) { return h1.local_type < h2.local_type; });
	
		for_each(
			begin(ordered_children), 
			end(ordered_children), 
			[indentation_level, &os, &first](auto child)
			{
				if(first) first = false;
				else os << ",\r\n";
				
				print_json(os, child, indentation_level + 2);
			});
			
		os << "\r\n";
		
		indent_level(os, indentation_level + 1);
	}
	
	os << "]\r\n";
	
	indent_level(os, indentation_level);
	os << "}";
}

string process_data(const vector<string>& lines)
{
	vector<record> records;
	
	string last_valid_text_id;

	transform(
		begin(lines) + 1,
		end(lines),
		back_inserter(records),
		[](auto line)
		{
			record raw_record;
			
			boost::algorithm::split(raw_record, line, boost::is_any_of(file_info::input_separator));
			
			record trimmed_record;
			
			transform(
				begin(raw_record),
				end(raw_record),
				back_inserter(trimmed_record),
				[](auto field)
				{					
					boost::algorithm::trim(field);
					
					return field;
				});
				
			return trimmed_record;
		});
	
	cout << "records.size() : " << records.size() << "\r\n";

	vector<record> trimmed_records;
	
	transform(
		begin(records),
		end(records),
		back_inserter(trimmed_records),
		[](auto r)
		{
			record trimmed_record;
			
			copy_if(
				begin(r),
				end(r),
				back_inserter(trimmed_record),
				[](auto value) { return !value.empty(); });

			return trimmed_record;
		});
		
	cout << "trimmed_records.size() : " << trimmed_records.size() << "\r\n";
	
	map<string, hierarchy> hierarchies;
	
	for_each(
		begin(trimmed_records),
		end(trimmed_records),
		[&hierarchies](auto trimmed_record)
		{
			auto text_id = trimmed_record[file_info::aggregation_key_idx];
//cout << "id : " << id << "\r\n";			
			hierarchy* h = &(hierarchies[text_id]);			
			h->text_id = text_id;
			
			string node_id = text_id;

			h->node_id = node_id;
			h->caption = text_id;
			h->level = 0;
	
			auto data_fields_count = trimmed_record.size() - 1;
			auto data_blocks_count = data_fields_count / file_info::level_columns_count;
			
			string basal_type;
			
			
			for(int level = 0; level < data_blocks_count; ++level)
			{
				auto block_offset = 
					file_info::first_level_first_column_offset + 
					level * file_info::level_columns_count;
					
				auto place_idx = 
					block_offset +
					file_info::place_column_block_idx;
					
				auto place = trimmed_record[place_idx];
				
				auto id_part = place;
				boost::replace_all(id_part, " ", "_");
				
				node_id += "@" + id_part;
				
				auto type_idx =
					block_offset +
					file_info::type_column_block_idx;
					
				auto local_type = trimmed_record[type_idx];
				
				if(level == 0) basal_type = local_type;
				
				if(h->children.find(place) == h->children.end())
				{
//cout << "adding to hierarchy.\r\n";
					hierarchy h2;
					h2.text_id = text_id;
					h2.node_id = node_id;
					h2.caption = place;
					h2.level = level + 1;
					h2.local_type = local_type;
					h2.basal_type = basal_type;
					h->children[place] = h2;
				}
//else cout << "not adding to hierarchy.\r\n";
			
				h = &(h->children[place]);
			}
		});

		
	cout << "hierarchies.size() : " << hierarchies.size() << "\r\n";

	ostringstream oss;
	
	auto indentation_level = 0;

	oss << "{\r\n";
	
	indent_level(oss, ++indentation_level);
	
	oss << "\"hierarchies\": [\r\n";
	
	auto first = true;
	
	for_each(
		begin(hierarchies),
		end(hierarchies),
		[&oss, &first, &indentation_level](auto hierarchy_pair)
		{
			if(first) first = false;
			else oss << ",\r\n";
			
			print_json(oss, hierarchy_pair.second, indentation_level + 1);
		});

	oss << "\r\n";

	indent_level(oss, indentation_level);
	
	oss << "]\r\n";
	
	oss << "}";

	return oss.str();
//	file_support::functions::write_file(file_info::output_filename, oss.str());

}

EMSCRIPTEN_BINDINGS(my_module) {
	emscripten::register_vector<string>("StringList");
	emscripten::function("process_data", &process_data);
}
